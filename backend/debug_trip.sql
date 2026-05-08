SELECT id, title FROM "Trip" WHERE title LIKE '%เขาเย็น อุ้มเปี้ยม%';

-- Also check BusRound for this trip
SELECT id, "startDate", "endDate", status FROM "BusRound" 
WHERE "tripId" IN (SELECT id FROM "Trip" WHERE title LIKE '%เขาเย็น อุ้มเปี้ยม%');
