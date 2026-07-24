from django.core.cache import cache

def get_cached_entities(entity_name, entity_ids, model_class, serializer_class, request=None):
    """
    Retrieves multiple serialized entities by ID, using Entity-Level caching (Cache-Aside).
    Queries the database only for IDs that missed the cache, serializes them, saves them,
    and returns the final results maintaining the original ID list order.
    """
    if not entity_ids:
        return []

    # 1. Translate IDs to cache keys
    cache_keys = [f"{entity_name}_detail:{eid}" for eid in entity_ids]
    
    # 2. Batch fetch from cache (very fast Redis call)
    try:
        cached_results = cache.get_many(cache_keys)
    except Exception:
        cached_results = {}

    # 3. Find which IDs missed the cache
    missed_ids = [eid for eid in entity_ids if f"{entity_name}_detail:{eid}" not in cached_results]

    # 4. Fetch missed objects from database
    serialized_misses = []
    if missed_ids:
        db_records = model_class.objects.filter(id__in=missed_ids)
        
        # Serialize the database records, passing request context if available
        context = {'request': request} if request else {}
        serialized_misses = serializer_class(db_records, many=True, context=context).data
        
        # Save missed objects to cache (300 seconds TTL)
        to_cache = {f"{entity_name}_detail:{item['id']}": item for item in serialized_misses}
        try:
            cache.set_many(to_cache, timeout=300)
        except Exception:
            pass

    # 5. Combine cached and database results in the original list order
    final_list = []
    for eid in entity_ids:
        key = f"{entity_name}_detail:{eid}"
        if key in cached_results:
            final_list.append(cached_results[key])
        else:
            # Find in the freshly serialized database hits
            item = next((x for x in serialized_misses if x['id'] == eid), None)
            if item:
                final_list.append(item)

    return final_list

def invalidate_entity(entity_name, entity_id):
    """
    Explicitly invalidates (deletes) the cache key of a specific entity.
    """
    try:
        cache.delete(f"{entity_name}_detail:{entity_id}")
    except Exception:
        pass
