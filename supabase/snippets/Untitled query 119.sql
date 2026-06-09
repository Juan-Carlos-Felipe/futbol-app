sqlSELECT v.name, COUNT(s.id) AS slots
FROM venues v
LEFT JOIN venue_slots s ON s.venue_id = v.id
GROUP BY v.name;