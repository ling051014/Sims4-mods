# -*- coding: utf-8 -*-
"""
L1nG Genealogy Exporter
Target: The Sims 4 1.128 / Python 3.7

設計原則：
- 全程只讀 FamilyTreeGraph / SimInfo / Household / Persistence / ResourceManager。
- 不呼叫 setup_graph、sync_missing_sims、push_sims_to_graph 或任何 set/clear 關係 API。
- 不提升 SimInfo LOD，不生成新 Sim，不改 Household，不修改存檔。
- 本地化只讀目前語言 STBL；hash 衝突時回退 internal name，不猜文字。
- 人物頭像只匯出「已存在、可直接讀取的持久 ResourceKey」；不把 DEFAULT_THUMBNAIL 冒充人物照片。
- 單一非核心欄位失敗時記錄 unavailable/error，不中止整份匯出。
"""

import datetime
import json
import os
import struct
import zipfile

import services
import sims4.log
import sims4.resources
from sims4.commands import Command, CommandType, CheatOutput
from family_tree.family_tree_enums import FamilyRelationBitFlags


MOD_NAME = "L1nG Genealogy Exporter"
EXPORTER_VERSION = "0.4.0-structural"
TARGET_GAME_VERSION = "1.128"
FORMAT_NAME = "l1ng-genealogy"
SCHEMA_VERSION = 1

STBL_TYPE = 0x220557DA
STBL_MAGIC = b"STBL"
STBL_VERSION = 5

LOCALE_STBL_HIGH_BYTE = {
    "en": 0x00,
    "en-us": 0x00,
    "zh-cn": 0x01,
    "zh-hans": 0x01,
    "zh-tw": 0x02,
    "zh-hant": 0x02,
    "cs-cz": 0x03,
    "da-dk": 0x04,
    "nl-nl": 0x05,
    "fi-fi": 0x06,
    "fr-fr": 0x07,
    "de-de": 0x08,
    "it-it": 0x0B,
    "ja-jp": 0x0C,
    "ko-kr": 0x0D,
    "nb-no": 0x0E,
    "no-no": 0x0E,
    "pl-pl": 0x0F,
    "pt-br": 0x11,
    "ru-ru": 0x12,
    "es-es": 0x13,
    "es-mx": 0x13,
    "sv-se": 0x15,
}

logger = sims4.log.Logger("L1nGGenealogy", default_owner="L1nG")


def _safe_get(obj, name, default=None):
    if obj is None:
        return default
    try:
        return getattr(obj, name)
    except Exception:
        return default


def _safe_call(obj, name, *args, **kwargs):
    if obj is None:
        return None
    try:
        fn = getattr(obj, name, None)
        if fn is None:
            return None
        return fn(*args, **kwargs)
    except Exception:
        return None


def _safe_invoke(value, *args):
    if value is None:
        return None
    if callable(value):
        try:
            return value(*args)
        except Exception:
            try:
                return value()
            except Exception:
                return None
    return value


def _id_string(value):
    if value is None:
        return None
    try:
        value = int(value)
        if value <= 0:
            return None
        return str(value)
    except Exception:
        text = str(value)
        return text if text else None


def _sim_id(sim_info):
    value = _safe_get(sim_info, "sim_id", None)
    if value is None:
        value = _safe_get(sim_info, "id", None)
    return _id_string(value)


def _enum_value(value):
    if value is None:
        return None
    result = {"key": None, "value": None}
    name = _safe_get(value, "name", None)
    if name:
        result["key"] = str(name).lower()
    else:
        text = str(value)
        if "." in text:
            result["key"] = text.rsplit(".", 1)[-1].lower()
        elif text:
            result["key"] = text.lower()
    try:
        result["value"] = int(value)
    except Exception:
        pass
    return result


def _tuning_id(obj):
    if obj is None:
        return None
    for name in ("guid64", "tuning_id", "id"):
        value = _safe_get(obj, name, None)
        if value:
            return _id_string(value)
    return None


def _internal_name(obj):
    if obj is None:
        return None
    for name in ("__name__", "name"):
        value = _safe_get(obj, name, None)
        if value and isinstance(value, str):
            return value
    try:
        return obj.__class__.__name__
    except Exception:
        return None


def _documents_dir():
    try:
        import ctypes
        from ctypes import wintypes
        buf = ctypes.create_unicode_buffer(wintypes.MAX_PATH)
        result = ctypes.windll.shell32.SHGetFolderPathW(None, 5, None, 0, buf)
        if result == 0 and buf.value:
            return buf.value
    except Exception:
        pass
    return os.path.join(os.path.expanduser("~"), "Documents")


def _export_dir():
    base = os.path.join(_documents_dir(), "Electronic Arts", "The Sims 4")
    path = os.path.join(base, "L1nG_Genealogy_Exports")
    if not os.path.isdir(path):
        os.makedirs(path)
    return path


def _timestamp_for_file():
    return datetime.datetime.now().strftime("%Y%m%d_%H%M%S")


def _iso_now():
    try:
        return datetime.datetime.now().astimezone().isoformat()
    except Exception:
        return datetime.datetime.now().isoformat()


def _locale():
    try:
        value = services.get_locale()
        return str(value) if value is not None else None
    except Exception:
        return None


def _normalized_locale(value):
    text = str(value or "").strip().lower().replace("_", "-")
    if text.startswith("zh-tw") or text.startswith("zh-hant"):
        return "zh-tw"
    if text.startswith("zh-cn") or text.startswith("zh-hans"):
        return "zh-cn"
    if text.startswith("en"):
        return "en-us"
    return text


def _iter_manager_values(manager):
    if manager is None:
        return []
    try:
        return list(manager.values())
    except Exception:
        pass
    try:
        return list(manager.get_all())
    except Exception:
        pass
    try:
        return list(manager)
    except Exception:
        return []


def _resource_key_dict(value):
    if value is None:
        return None
    rtype = _safe_get(value, "type", None)
    group = _safe_get(value, "group", None)
    instance = _safe_get(value, "instance", None)
    if rtype is None or instance is None:
        return None
    try:
        return {
            "type": int(rtype),
            "group": int(group or 0),
            "instance": str(int(instance)),
        }
    except Exception:
        return None


def _resource_key_object(value):
    info = _resource_key_dict(value)
    if not info:
        return None
    try:
        return sims4.resources.Key(
            int(info["type"]),
            int(info["instance"]),
            int(info["group"]),
        )
    except Exception:
        try:
            return sims4.resources.get_key_from_protobuff(value)
        except Exception:
            return None


def _same_resource_key(a, b):
    da = _resource_key_dict(a)
    db = _resource_key_dict(b)
    return bool(da and db and da == db)


def _localized_ref(value):
    if value is None:
        return None
    hash_value = _safe_get(value, "hash", None)
    if hash_value is None:
        return None
    try:
        hash_value = int(hash_value) & 0xFFFFFFFF
    except Exception:
        return None
    tokens = _safe_get(value, "tokens", None)
    try:
        token_count = len(tokens or [])
    except Exception:
        token_count = 0
    return {
        "hash": hash_value,
        "tokenCount": token_count,
    }


def _parse_stbl_bytes(data):
    if not data or len(data) < 21 or data[:4] != STBL_MAGIC:
        return []
    version = struct.unpack_from("<H", data, 4)[0]
    if version != STBL_VERSION:
        return []
    entry_count = struct.unpack_from("<Q", data, 7)[0]
    offset = 21
    result = []
    for _ in range(entry_count):
        if offset + 7 > len(data):
            break
        key_hash = struct.unpack_from("<I", data, offset)[0]
        offset += 4
        flags = data[offset]
        offset += 1
        string_length = struct.unpack_from("<H", data, offset)[0]
        offset += 2
        if offset + string_length > len(data):
            break
        raw = data[offset:offset + string_length]
        offset += string_length
        try:
            text = raw.decode("utf-8")
        except Exception:
            text = raw.decode("utf-8", errors="replace")
        result.append((key_hash, flags, text))
    return result


class _LocalizedTextResolver(object):
    def __init__(self, locale_value):
        self.locale = _normalized_locale(locale_value)
        self.locale_byte = LOCALE_STBL_HIGH_BYTE.get(self.locale)
        self.loaded = False
        self.values = {}
        self.conflicts = set()
        self.table_count = 0
        self.entry_count = 0
        self.error_count = 0

    def _resource_keys(self):
        try:
            values = sims4.resources.list(type=STBL_TYPE)
        except Exception:
            return []
        if isinstance(values, tuple):
            if values and isinstance(values[0], (list, tuple, set)):
                values = values[0]
        try:
            return list(values or [])
        except Exception:
            return []

    def _matches_locale(self, key):
        if self.locale_byte is None:
            return False
        instance = _safe_get(key, "instance", None)
        try:
            return ((int(instance) >> 56) & 0xFF) == int(self.locale_byte)
        except Exception:
            return False

    def _load(self):
        if self.loaded:
            return
        self.loaded = True
        if self.locale_byte is None:
            return
        for key in self._resource_keys():
            if not self._matches_locale(key):
                continue
            try:
                raw = sims4.resources.load(key)
                data = bytes(raw)
                entries = _parse_stbl_bytes(data)
                if not entries:
                    continue
                self.table_count += 1
                self.entry_count += len(entries)
                for key_hash, _flags, text in entries:
                    if not text:
                        continue
                    previous = self.values.get(key_hash)
                    if previous is None:
                        self.values[key_hash] = text
                    elif previous != text:
                        self.conflicts.add(key_hash)
            except Exception:
                self.error_count += 1

    def resolve_hash(self, hash_value):
        self._load()
        try:
            key_hash = int(hash_value) & 0xFFFFFFFF
        except Exception:
            return None
        if key_hash in self.conflicts:
            return None
        return self.values.get(key_hash)

    def resolve_localized(self, value):
        ref = _localized_ref(value)
        if not ref:
            return None, None
        return self.resolve_hash(ref["hash"]), ref

    def stats(self):
        self._load()
        return {
            "locale": self.locale,
            "localeHighByte": self.locale_byte,
            "tableCount": self.table_count,
            "entryCount": self.entry_count,
            "conflictCount": len(self.conflicts),
            "errorCount": self.error_count,
        }


def _resolve_localized_source(resolver, source, *tokens):
    localized = _safe_invoke(source, *tokens)
    text, ref = resolver.resolve_localized(localized)
    return text, ref


def _relation_flag_names(raw_flags):
    flags = []
    mapping = (
        (FamilyRelationBitFlags.PARENT, "parent"),
        (FamilyRelationBitFlags.CHILD, "child"),
        (FamilyRelationBitFlags.SPOUSE, "spouse"),
        (FamilyRelationBitFlags.FIANCE, "fiance"),
        (FamilyRelationBitFlags.STEADY, "steady"),
        (FamilyRelationBitFlags.ADOPTED, "adopted"),
        (FamilyRelationBitFlags.FORGED, "forged"),
        (FamilyRelationBitFlags.SECRET_PARENT, "secret_parent"),
        (FamilyRelationBitFlags.SECRET_CHILD, "secret_child"),
    )
    try:
        value = int(raw_flags)
    except Exception:
        value = 0
    for flag, name in mapping:
        try:
            if value & int(flag):
                flags.append(name)
        except Exception:
            pass
    return flags


def _empty_relations():
    return {
        "parentIds": [],
        "childIds": [],
        "spouseIds": [],
        "fianceIds": [],
        "steadyPartnerIds": [],
        "adoptedParentIds": [],
        "adoptedChildIds": [],
        "exSpouseIds": [],
        "deceasedSpouseIds": [],
        "ownerIds": [],
    }


def _add_unique(container, key, value):
    if value is None:
        return
    if value not in container[key]:
        container[key].append(value)


def _collect_graph(resolver):
    service = services.family_tree_service()
    graph = _safe_get(service, "family_tree_graph", None)
    if graph is None:
        raise RuntimeError("FamilyTreeService 尚未提供 family_tree_graph。請進入存檔並等待遊戲完成載入後再匯出。")

    nodes = _safe_get(graph, "nodes", {}) or {}
    node_records = {}
    relation_map = {}
    edges = []
    seen_edges = set()

    for sim_id_raw, node in list(nodes.items()):
        sid = _id_string(sim_id_raw)
        if sid is None:
            continue
        full_name = _safe_get(node, "full_name", None)
        if full_name is None:
            full_name = _safe_get(node, "localized_full_name", None)
        localized_name, localized_ref = resolver.resolve_localized(full_name)
        thumbnail = _safe_get(node, "thumbnail_override", None)
        node_records[sid] = {
            "simId": sid,
            "isCulled": bool(_safe_get(node, "is_culled", False)),
            "firstName": _safe_get(node, "first_name", "") or "",
            "lastName": _safe_get(node, "last_name", "") or "",
            "localizedFullName": localized_name,
            "localizedNameRef": localized_ref,
            "gender": _enum_value(_safe_get(node, "gender", None)),
            "thumbnailResourceKey": _resource_key_dict(thumbnail),
            "thumbnailResourceObject": thumbnail,
            "deathTraitOverrideId": _id_string(_safe_get(node, "death_trait_override", None)),
        }
        relation_map[sid] = _empty_relations()

    for sid, node_record in list(node_records.items()):
        node = None
        try:
            node = nodes.get(int(sid))
        except Exception:
            pass
        if node is None:
            try:
                node = nodes.get(sid)
            except Exception:
                node = None
        if node is None:
            continue

        for edge in list(_safe_get(node, "outgoing_edges", []) or []):
            source = _id_string(_safe_get(edge, "source_sim_id", None)) or sid
            target = _id_string(_safe_get(edge, "target_sim_id", None))
            if target is None:
                continue
            raw = _safe_get(edge, "edge_data", 0)
            try:
                raw_int = int(raw)
            except Exception:
                raw_int = 0
            edge_key = (source, target, raw_int)
            if edge_key in seen_edges:
                continue
            seen_edges.add(edge_key)
            flag_names = _relation_flag_names(raw_int)
            edges.append({
                "sourceSimId": source,
                "targetSimId": target,
                "flags": raw_int,
                "relations": flag_names,
            })

            rels = relation_map.setdefault(source, _empty_relations())
            adopted = "adopted" in flag_names
            if "child" in flag_names:
                _add_unique(rels, "parentIds", target)
                if adopted:
                    _add_unique(rels, "adoptedParentIds", target)
            if "parent" in flag_names:
                _add_unique(rels, "childIds", target)
                if adopted:
                    _add_unique(rels, "adoptedChildIds", target)
            if "spouse" in flag_names:
                _add_unique(rels, "spouseIds", target)
            if "fiance" in flag_names:
                _add_unique(rels, "fianceIds", target)
            if "steady" in flag_names:
                _add_unique(rels, "steadyPartnerIds", target)

    return service, graph, node_records, relation_map, edges


def _collect_relationship_tracker_spouses(service, sim_info, rels):
    tracker = _safe_get(sim_info, "relationship_tracker", None)
    if tracker is None:
        return
    sid_raw = _safe_get(sim_info, "sim_id", _safe_get(sim_info, "id", None))
    divorced_bit = _safe_get(service, "DIVORCED_SPOUSE_RELATIONSHIP_BIT", None)
    dead_bit = _safe_get(service, "DEAD_SPOUSE_RELATIONSHIP_BIT", None)
    if divorced_bit is None and dead_bit is None:
        return
    try:
        relationships = list(tracker)
    except Exception:
        return
    for relationship in relationships:
        try:
            other_id = _id_string(relationship.get_other_sim_id(sid_raw))
        except Exception:
            other_id = None
        if other_id is None:
            continue
        if divorced_bit is not None:
            try:
                if relationship.has_bit(sid_raw, divorced_bit):
                    _add_unique(rels, "exSpouseIds", other_id)
            except Exception:
                pass
        if dead_bit is not None:
            try:
                if relationship.has_bit(sid_raw, dead_bit):
                    _add_unique(rels, "deceasedSpouseIds", other_id)
            except Exception:
                pass


def _collect_traits(sim_info, resolver):
    tracker = _safe_get(sim_info, "trait_tracker", None)
    if tracker is None:
        return [], "unavailable"
    try:
        traits = list(tracker.personality_traits)
    except Exception:
        try:
            traits = list(tracker.get_traits())
        except Exception:
            traits = []
    result = []
    for trait in traits:
        localized = _safe_get(trait, "display_name_gender_neutral", None)
        localized_name, localized_ref = resolver.resolve_localized(localized)
        if not localized_name:
            localized_name, localized_ref = _resolve_localized_source(
                resolver,
                _safe_get(trait, "display_name", None),
                sim_info,
            )
        result.append({
            "tuningId": _tuning_id(trait),
            "internalName": _internal_name(trait),
            "localizedName": localized_name,
            "localizedNameRef": localized_ref,
            "type": _enum_value(_safe_get(trait, "trait_type", None)),
        })
    return result, "available"


def _collect_careers(sim_info, resolver):
    tracker = _safe_get(sim_info, "career_tracker", None)
    if tracker is None:
        return [], "unavailable"
    careers_obj = _safe_get(tracker, "careers", None)
    if careers_obj is None:
        return [], "available"
    try:
        careers = list(careers_obj.values())
    except Exception:
        try:
            careers = list(careers_obj)
        except Exception:
            careers = []

    result = []
    for career in careers:
        level = _safe_get(career, "user_level", None)
        if level is None:
            level = _safe_get(career, "level", None)
        track = _safe_get(career, "current_track_tuning", None)
        if track is None:
            track = _safe_get(career, "_current_track", None)
        career_localized = _safe_call(track, "get_career_name", sim_info)
        career_name, career_ref = resolver.resolve_localized(career_localized)
        level_tuning = _safe_get(career, "current_level_tuning", None)
        level_localized = _safe_call(level_tuning, "get_title", sim_info)
        level_name, level_ref = resolver.resolve_localized(level_localized)
        result.append({
            "careerId": _tuning_id(career),
            "internalName": _internal_name(career),
            "localizedName": career_name,
            "localizedNameRef": career_ref,
            "level": level,
            "levelName": level_name,
            "levelNameRef": level_ref,
            "isRetired": bool(_safe_get(career, "is_retired", False)),
        })
    return result, "available"


def _collect_aspiration(sim_info, resolver):
    aspiration = _safe_get(sim_info, "primary_aspiration", None)
    tracker = _safe_get(sim_info, "aspiration_tracker", None)
    availability = "available" if tracker is not None else "unavailable"
    if aspiration is None:
        return None, availability

    localized = _safe_get(aspiration, "display_text", None)
    if localized is None:
        localized = _safe_get(aspiration, "display_name", None)
    localized_name, localized_ref = resolver.resolve_localized(_safe_invoke(localized, sim_info))

    return {
        "tuningId": _tuning_id(aspiration),
        "internalName": _internal_name(aspiration),
        "localizedName": localized_name,
        "localizedNameRef": localized_ref,
        "source": "sim_info.primary_aspiration",
    }, availability


def _collect_occult(sim_info):
    value = _safe_get(sim_info, "occult_types", None)
    if value is None:
        return {"raw": None, "label": None}
    raw = None
    try:
        raw = int(value)
    except Exception:
        pass
    return {"raw": raw, "label": str(value)}


def _collect_death(sim_info):
    death_type = _safe_get(sim_info, "death_type", None)
    is_ghost = bool(_safe_get(sim_info, "is_ghost", False))
    is_dead = bool(_safe_get(sim_info, "is_dead", False))
    if death_type is not None:
        try:
            is_dead = is_dead or int(death_type) != 0
        except Exception:
            pass
    return {
        "isDead": is_dead,
        "isGhost": is_ghost,
        "deathType": _enum_value(death_type),
    }


def _resource_bytes(resource_value):
    key = _resource_key_object(resource_value)
    if key is None:
        return None, None, None
    try:
        raw = sims4.resources.load(key)
        data = bytes(raw)
    except Exception:
        return None, _resource_key_dict(resource_value), "load_failed"
    if not data:
        return None, _resource_key_dict(resource_value), "empty"

    ext = None
    mime = None
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        ext, mime = "png", "image/png"
    elif data[:3] == b"\xff\xd8\xff":
        ext, mime = "jpg", "image/jpeg"
    elif data[:2] == b"BM":
        ext, mime = "bmp", "image/bmp"
    elif data[:4] == b"DDS ":
        ext, mime = "dds", "image/vnd-ms.dds"
    else:
        rtype = _safe_get(key, "type", None)
        try:
            if int(rtype) == int(sims4.resources.Types.PNG):
                ext, mime = "png", "image/png"
        except Exception:
            pass

    if not ext:
        return None, _resource_key_dict(resource_value), "unknown_format"
    return (data, ext, mime), _resource_key_dict(resource_value), None


def _collect_portrait(sim_info, node_record):
    candidates = []
    node_key = node_record.get("thumbnailResourceObject") if node_record else None
    if node_key is not None:
        candidates.append(("family_tree.thumbnail_override", node_key))

    if sim_info is not None:
        sim_thumbnail = _safe_get(sim_info, "thumbnail", None)
        default_thumbnail = _safe_get(sim_info, "DEFAULT_THUMBNAIL", None)
        if sim_thumbnail is not None and not _same_resource_key(sim_thumbnail, default_thumbnail):
            candidates.append(("sim_info.thumbnail_override", sim_thumbnail))

    for source, resource_value in candidates:
        loaded, key_info, error = _resource_bytes(resource_value)
        if loaded is None:
            continue
        data, ext, mime = loaded
        return {
            "source": source,
            "resourceKey": key_info,
            "extension": ext,
            "mimeType": mime,
            "byteLength": len(data),
        }, data

    return None, None


def _sim_record(sim_info, node_record, rels, family_tree_service, resolver, portrait_assets):
    sid = _sim_id(sim_info) if sim_info is not None else node_record["simId"]
    if rels is None:
        rels = _empty_relations()

    portrait_meta, portrait_bytes = _collect_portrait(sim_info, node_record)
    if portrait_meta and portrait_bytes:
        path = "avatars/{}.{}".format(sid, portrait_meta["extension"])
        portrait_meta["path"] = path
        portrait_assets[path] = portrait_bytes

    family_tree_overrides = {
        "localizedNameRef": node_record.get("localizedNameRef"),
        "thumbnailResourceKey": node_record.get("thumbnailResourceKey"),
        "deathTraitOverrideId": node_record.get("deathTraitOverrideId"),
    }
    if not any(value for value in family_tree_overrides.values()):
        family_tree_overrides = None

    if sim_info is None:
        first = node_record.get("firstName", "")
        last = node_record.get("lastName", "")
        display = node_record.get("localizedFullName") or (first + " " + last).strip()
        return {
            "simId": sid,
            "recordState": "family_tree_only",
            "isCulled": bool(node_record.get("isCulled")),
            "name": {
                "first": first,
                "last": last,
                "display": display,
                "localizedRef": node_record.get("localizedNameRef"),
            },
            "gender": node_record.get("gender"),
            "relations": rels,
            "familyTreeOverrides": family_tree_overrides,
            "portrait": portrait_meta,
            "dataAvailability": {
                "simInfo": "unavailable",
                "traits": "unavailable",
                "careers": "unavailable",
                "aspiration": "unavailable",
                "occult": "unavailable",
                "death": "partial",
            },
        }

    first_name = _safe_get(sim_info, "first_name", "") or node_record.get("firstName", "")
    last_name = _safe_get(sim_info, "last_name", "") or node_record.get("lastName", "")
    display = _safe_get(sim_info, "full_name", None)
    if not display:
        display = (str(first_name) + " " + str(last_name)).strip()
    if not display:
        display = node_record.get("localizedFullName") or ""

    _collect_relationship_tracker_spouses(family_tree_service, sim_info, rels)
    traits, traits_availability = _collect_traits(sim_info, resolver)
    careers, career_availability = _collect_careers(sim_info, resolver)
    aspiration, aspiration_availability = _collect_aspiration(sim_info, resolver)

    household_id = _id_string(_safe_get(sim_info, "household_id", None))
    lod = _enum_value(_safe_get(sim_info, "lod", None))

    service_hint = bool(
        _safe_get(sim_info, "is_service_npc", False) or
        _safe_get(sim_info, "service_npc", False) or
        _safe_get(sim_info, "service_role", None)
    )

    return {
        "simId": sid,
        "recordState": "full",
        "isCulled": bool(node_record.get("isCulled", False)),
        "name": {
            "first": first_name,
            "last": last_name,
            "display": display,
            "localizedRef": node_record.get("localizedNameRef"),
        },
        "gender": _enum_value(_safe_get(sim_info, "gender", None)),
        "age": _enum_value(_safe_get(sim_info, "age", None)),
        "species": _enum_value(_safe_get(sim_info, "species", None)),
        "lod": lod,
        "householdId": household_id,
        "isSelectable": bool(_safe_get(sim_info, "is_selectable", False)),
        "isNpc": bool(_safe_get(sim_info, "is_npc", False)),
        "serviceNpc": service_hint,
        "relations": rels,
        "traits": traits,
        "careers": careers,
        "aspiration": aspiration,
        "occult": _collect_occult(sim_info),
        "death": _collect_death(sim_info),
        "familyTreeOverrides": family_tree_overrides,
        "portrait": portrait_meta,
        "dataAvailability": {
            "simInfo": "available",
            "traits": traits_availability,
            "careers": career_availability,
            "aspiration": aspiration_availability,
            "occult": "available",
            "death": "available",
        },
    }


def _localized_tuning_name(resolver, tuning, token=None):
    if tuning is None:
        return None, None
    for attr in ("display_name", "display_text", "name"):
        value = _safe_get(tuning, attr, None)
        if value is None:
            continue
        localized = _safe_invoke(value, token) if token is not None else _safe_invoke(value)
        text, ref = resolver.resolve_localized(localized)
        if text or ref:
            return text, ref
    return None, None


def _zone_metadata(zone_id, resolver):
    result = {
        "zoneId": _id_string(zone_id),
        "lotName": None,
        "worldId": None,
        "worldDescriptionId": None,
        "worldName": None,
        "worldNameRef": None,
        "neighborhoodId": None,
        "neighborhoodName": None,
        "regionId": None,
        "regionName": None,
        "regionNameRef": None,
    }
    if not zone_id:
        return result

    persistence = services.get_persistence_service()
    try:
        zone_int = int(zone_id)
    except Exception:
        return result
    zone = _safe_call(persistence, "get_zone_proto_buff", zone_int)
    if zone is None:
        return result

    result["lotName"] = _safe_get(zone, "name", None) or None
    world_id = _safe_get(zone, "world_id", None)
    neighborhood_id = _safe_get(zone, "neighborhood_id", None)
    result["worldId"] = _id_string(world_id)
    result["neighborhoodId"] = _id_string(neighborhood_id)

    world_description_id = _safe_call(services, "get_world_description_id", world_id)
    result["worldDescriptionId"] = _id_string(world_description_id)
    if world_description_id:
        try:
            manager = services.get_instance_manager(sims4.resources.Types.WORLD_DESCRIPTION)
            tuning = manager.get(int(world_description_id)) if manager is not None else None
        except Exception:
            tuning = None
        world_name, world_ref = _localized_tuning_name(resolver, tuning)
        result["worldName"] = world_name
        result["worldNameRef"] = world_ref

    neighborhood = _safe_call(persistence, "get_neighborhood_proto_buff", neighborhood_id)
    if neighborhood is not None:
        result["neighborhoodName"] = _safe_get(neighborhood, "name", None) or None
        region_id = _safe_get(neighborhood, "region_id", None)
        result["regionId"] = _id_string(region_id)
        if region_id:
            try:
                manager = services.get_instance_manager(sims4.resources.Types.REGION)
                region_tuning = manager.get(int(region_id)) if manager is not None else None
            except Exception:
                region_tuning = None
            region_name, region_ref = _localized_tuning_name(resolver, region_tuning)
            result["regionName"] = region_name
            result["regionNameRef"] = region_ref

    return result


def _collect_households(sim_records, resolver):
    manager = services.household_manager()
    households = {}

    for household in _iter_manager_values(manager):
        hid = _id_string(_safe_get(household, "id", None))
        if hid is None:
            continue
        member_ids = []
        try:
            members = list(household.sim_info_gen())
        except Exception:
            members = list(_safe_get(household, "sim_infos", []) or [])
        for sim_info in members:
            sid = _sim_id(sim_info)
            if sid and sid not in member_ids:
                member_ids.append(sid)

        home_zone_id = _id_string(_safe_get(household, "home_zone_id", None))
        location = _zone_metadata(home_zone_id, resolver)
        description = _safe_get(household, "description", None)
        if description is None:
            description = _safe_get(household, "bio", None)
        if description is not None and not isinstance(description, str):
            description = str(description)

        households[hid] = {
            "householdId": hid,
            "name": _safe_get(household, "name", "") or "",
            "description": description or "",
            "memberIds": member_ids,
            "homeZoneId": home_zone_id,
            "zoneId": location.get("zoneId"),
            "lotName": location.get("lotName"),
            "worldId": location.get("worldId"),
            "worldDescriptionId": location.get("worldDescriptionId"),
            "worldName": location.get("worldName"),
            "worldNameRef": location.get("worldNameRef"),
            "neighborhoodId": location.get("neighborhoodId"),
            "neighborhoodName": location.get("neighborhoodName"),
            "regionId": location.get("regionId"),
            "regionName": location.get("regionName"),
            "regionNameRef": location.get("regionNameRef"),
            "hidden": bool(_safe_get(household, "hidden", False)),
            "isActiveHousehold": bool(_safe_get(household, "is_active_household", False)),
            "isPlayerHousehold": bool(_safe_get(household, "is_player_household", False)),
            "isPlayedHousehold": bool(_safe_get(household, "is_played_household", False)),
            "portrait": None,
        }

    for sid, sim in sim_records.items():
        hid = sim.get("householdId")
        if not hid:
            continue
        if hid not in households:
            households[hid] = {
                "householdId": hid,
                "name": "",
                "description": "",
                "memberIds": [],
                "homeZoneId": None,
                "zoneId": None,
                "lotName": None,
                "worldId": None,
                "worldDescriptionId": None,
                "worldName": None,
                "worldNameRef": None,
                "neighborhoodId": None,
                "neighborhoodName": None,
                "regionId": None,
                "regionName": None,
                "regionNameRef": None,
                "hidden": False,
                "isActiveHousehold": False,
                "isPlayerHousehold": False,
                "isPlayedHousehold": False,
                "portrait": None,
            }
        if sid not in households[hid]["memberIds"]:
            households[hid]["memberIds"].append(sid)

    return households


def _validate_genealogy(genealogy):
    errors = []
    sims = genealogy.get("sims", {})
    for sid, sim in sims.items():
        if str(sim.get("simId")) != str(sid):
            errors.append({"simId": str(sid), "error": "simId mismatch"})
        rel = sim.get("relations") or {}
        for key in (
            "parentIds", "childIds", "spouseIds", "fianceIds",
            "steadyPartnerIds", "adoptedParentIds", "adoptedChildIds",
            "exSpouseIds", "deceasedSpouseIds"
        ):
            values = rel.get(key, [])
            if not isinstance(values, list):
                errors.append({"simId": str(sid), "error": "{} is not list".format(key)})
    return errors


def _collect_all():
    resolver = _LocalizedTextResolver(_locale())
    family_tree_service, graph, node_records, relation_map, edges = _collect_graph(resolver)
    sim_info_manager = services.sim_info_manager()

    sim_infos = {}
    for sim_info in _iter_manager_values(sim_info_manager):
        sid = _sim_id(sim_info)
        if sid:
            sim_infos[sid] = sim_info

    all_ids = set(node_records.keys()) | set(sim_infos.keys())
    sims = {}
    errors = []
    portrait_assets = {}

    for sid in sorted(all_ids):
        node_record = node_records.get(sid) or {
            "simId": sid,
            "isCulled": False,
            "firstName": "",
            "lastName": "",
            "localizedFullName": None,
            "localizedNameRef": None,
            "gender": None,
            "thumbnailResourceKey": None,
            "thumbnailResourceObject": None,
            "deathTraitOverrideId": None,
        }
        rels = relation_map.get(sid) or _empty_relations()
        try:
            sims[sid] = _sim_record(
                sim_infos.get(sid),
                node_record,
                rels,
                family_tree_service,
                resolver,
                portrait_assets,
            )
        except Exception as exc:
            errors.append({"simId": sid, "error": str(exc)})
            sims[sid] = {
                "simId": sid,
                "recordState": "error_partial",
                "isCulled": bool(node_record.get("isCulled", False)),
                "name": {
                    "first": node_record.get("firstName", ""),
                    "last": node_record.get("lastName", ""),
                    "display": node_record.get("localizedFullName") or (
                        node_record.get("firstName", "") + " " + node_record.get("lastName", "")
                    ).strip(),
                    "localizedRef": node_record.get("localizedNameRef"),
                },
                "relations": rels,
                "familyTreeOverrides": {
                    "localizedNameRef": node_record.get("localizedNameRef"),
                    "thumbnailResourceKey": node_record.get("thumbnailResourceKey"),
                    "deathTraitOverrideId": node_record.get("deathTraitOverrideId"),
                },
                "portrait": None,
                "error": str(exc),
            }

    households = _collect_households(sims, resolver)
    validation_errors = _validate_genealogy({"sims": sims})
    errors.extend(validation_errors)

    stats = {
        "simCount": len(sims),
        "fullSimInfoCount": sum(1 for x in sims.values() if x.get("recordState") == "full"),
        "familyTreeOnlyCount": sum(1 for x in sims.values() if x.get("recordState") == "family_tree_only"),
        "culledNodeCount": sum(1 for x in node_records.values() if x.get("isCulled")),
        "householdCount": len(households),
        "edgeCount": len(edges),
        "errorCount": len(errors),
        "simPortraitCount": len(portrait_assets),
        "validationPassed": len(validation_errors) == 0,
        "localizedStringTables": resolver.stats(),
    }

    genealogy = {
        "schemaVersion": SCHEMA_VERSION,
        "sims": sims,
        "households": households,
        "edges": edges,
        "stats": stats,
        "errors": errors,
    }

    return genealogy, portrait_assets, resolver


def _manifest(genealogy, portrait_assets, resolver):
    localization_stats = resolver.stats()
    return {
        "format": FORMAT_NAME,
        "schemaVersion": SCHEMA_VERSION,
        "exporterVersion": EXPORTER_VERSION,
        "targetGameVersion": TARGET_GAME_VERSION,
        "gameLocale": _locale(),
        "exportedAt": _iso_now(),
        "capabilities": {
            "genealogy": True,
            "households": True,
            "traits": True,
            "careers": True,
            "aspiration": True,
            "occult": True,
            "death": True,
            "localizedDisplayText": localization_stats.get("tableCount", 0) > 0,
            "simPortraits": len(portrait_assets) > 0,
            "simPortraitExport": True,
            "dynamicSimPortraitBytes": False,
            "persistentThumbnailResourceLoad": True,
            "householdPortraits": False,
            "familyTreeLocalizedNameRefs": True,
            "worldLotMetadata": True,
            "portraitZipPackaging": True,
        },
        "stats": genealogy.get("stats", {}),
    }


def export_genealogy_bundle():
    genealogy, portrait_assets, resolver = _collect_all()
    manifest = _manifest(genealogy, portrait_assets, resolver)
    export_dir = _export_dir()
    stamp = _timestamp_for_file()
    zip_path = os.path.join(export_dir, "L1nG_Genealogy_Export_{}.zip".format(stamp))

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_STORED) as archive:
        archive.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2))
        archive.writestr("genealogy.json", json.dumps(genealogy, ensure_ascii=False, indent=2))
        for path, data in sorted(portrait_assets.items()):
            archive.writestr(path, data)

    return zip_path, genealogy, manifest


@Command("l1ng.genealogy.export", command_type=CommandType.Live)
def l1ng_genealogy_export(_connection=None):
    output = CheatOutput(_connection)
    output("[L1nG Genealogy] 開始唯讀匯出目前存檔…")
    try:
        path, genealogy, manifest = export_genealogy_bundle()
        stats = genealogy.get("stats", {})
        output("[L1nG Genealogy] 匯出完成。")
        output("人物：{}（完整 {} / 僅族譜 {}）".format(
            stats.get("simCount", 0),
            stats.get("fullSimInfoCount", 0),
            stats.get("familyTreeOnlyCount", 0),
        ))
        output("家庭：{} / 關係邊：{} / 頭像：{} / 欄位錯誤：{}".format(
            stats.get("householdCount", 0),
            stats.get("edgeCount", 0),
            stats.get("simPortraitCount", 0),
            stats.get("errorCount", 0),
        ))
        output("驗證：{}".format("PASS" if stats.get("validationPassed") else "CHECK"))
        output("檔案：{}".format(path))
        logger.info("Genealogy export completed: {}", path)
    except Exception as exc:
        logger.exception("Genealogy export failed")
        output("[L1nG Genealogy] 匯出失敗：{}".format(exc))
        output("請提供 lastException.txt 與遊戲版本給 L1nG。")


@Command("l1ng.genealogy.status", command_type=CommandType.Live)
def l1ng_genealogy_status(_connection=None):
    output = CheatOutput(_connection)
    try:
        service = services.family_tree_service()
        graph = _safe_get(service, "family_tree_graph", None)
        nodes = _safe_get(graph, "nodes", {}) if graph is not None else {}
        sim_count = len(_iter_manager_values(services.sim_info_manager()))
        household_count = len(_iter_manager_values(services.household_manager()))
        resolver = _LocalizedTextResolver(_locale())
        localization = resolver.stats()
        output("[L1nG Genealogy] Exporter {}".format(EXPORTER_VERSION))
        output("Locale：{} / STBL：{} tables".format(_locale(), localization.get("tableCount", 0)))
        output("SimInfo：{} / FamilyTree nodes：{} / Households：{}".format(
            sim_count, len(nodes or {}), household_count
        ))
        output("FamilyTree：{}".format("ready" if graph is not None else "not ready"))
    except Exception as exc:
        output("[L1nG Genealogy] 狀態讀取失敗：{}".format(exc))