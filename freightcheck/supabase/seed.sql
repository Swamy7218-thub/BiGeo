-- FreightCheck Demo Seed Data
INSERT INTO companies (id, name, industry, plan) VALUES
  ('11111111-1111-1111-1111-111111111111','Sunrise Pharma Pvt Ltd','Pharmaceuticals','growth');

INSERT INTO transporters (id, company_id, name, gstin) VALUES
  ('aaaa0001-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','VRL Logistics Ltd','29AABCV1234A1Z5'),
  ('bbbb0002-bbbb-bbbb-bbbb-bbbbbbbbbbbb','11111111-1111-1111-1111-111111111111','Safe Express Pvt Ltd','07AABCS5678B2Z6'),
  ('cccc0003-cccc-cccc-cccc-cccccccccccc','11111111-1111-1111-1111-111111111111','TCI Express Ltd','36AABCT9012C3Z7');

INSERT INTO rate_contracts (id, transporter_id, raw_file_url, valid_from, valid_to, status) VALUES
  ('rc110001-0001-0001-0001-000000000001','aaaa0001-aaaa-aaaa-aaaa-aaaaaaaaaaaa','s3://fc-docs/contracts/vrl-2025.pdf','2025-01-01','2025-12-31','confirmed'),
  ('rc220002-0002-0002-0002-000000000002','bbbb0002-bbbb-bbbb-bbbb-bbbbbbbbbbbb','s3://fc-docs/contracts/safe-2025.pdf','2025-01-01','2025-12-31','confirmed'),
  ('rc330003-0003-0003-0003-000000000003','cccc0003-cccc-cccc-cccc-cccccccccccc','s3://fc-docs/contracts/tci-2025.pdf','2025-01-01','2025-12-31','confirmed');

INSERT INTO rate_lines (contract_id, origin, destination, vehicle_type, rate, rate_basis, detention_free_days, detention_rate) VALUES
  ('rc110001-0001-0001-0001-000000000001','Mumbai','Pune','14ft',12500,'per_trip',1,1200),
  ('rc110001-0001-0001-0001-000000000001','Mumbai','Nashik','14ft',15000,'per_trip',1,1200),
  ('rc110001-0001-0001-0001-000000000001','Mumbai','Aurangabad','17ft',22000,'per_trip',2,1500),
  ('rc110001-0001-0001-0001-000000000001','Pune','Hyderabad','20ft',32000,'per_trip',2,1800),
  ('rc110001-0001-0001-0001-000000000001','Mumbai','Bengaluru','20ft',45000,'per_trip',2,2000),
  ('rc220002-0002-0002-0002-000000000002','Delhi','Chandigarh','14ft',11000,'per_trip',1,1000),
  ('rc220002-0002-0002-0002-000000000002','Delhi','Jaipur','14ft',14500,'per_trip',1,1000),
  ('rc220002-0002-0002-0002-000000000002','Delhi','Lucknow','17ft',19000,'per_trip',2,1400),
  ('rc220002-0002-0002-0002-000000000002','Delhi','Kolkata','20ft',42000,'per_trip',3,1800),
  ('rc330003-0003-0003-0003-000000000003','Chennai','Bengaluru','14ft',13500,'per_trip',1,1100),
  ('rc330003-0003-0003-0003-000000000003','Chennai','Hyderabad','17ft',21000,'per_trip',2,1500),
  ('rc330003-0003-0003-0003-000000000003','Chennai','Coimbatore','14ft',9500,'per_trip',1,900),
  ('rc330003-0003-0003-0003-000000000003','Bengaluru','Mumbai','20ft',43000,'per_trip',2,2000);

INSERT INTO bills (id, transporter_id, bill_number, bill_date, raw_file_url, status, total_claimed, total_approved, total_flagged) VALUES
  ('b1000001-0001-0001-0001-000000000001','aaaa0001-aaaa-aaaa-aaaa-aaaaaaaaaaaa','VRL/2025/06/1042','2025-06-30','s3://fc-docs/bills/vrl-jun.pdf','ready',247500,221000,26500),
  ('b2000002-0002-0002-0002-000000000002','bbbb0002-bbbb-bbbb-bbbb-bbbbbbbbbbbb','SEX/2025/06/789','2025-06-28','s3://fc-docs/bills/safe-jun.pdf','reviewed',183000,165000,18000),
  ('b3000003-0003-0003-0003-000000000003','cccc0003-cccc-cccc-cccc-cccccccccccc','TCI/2025/06/456','2025-06-25','s3://fc-docs/bills/tci-jun.pdf','ready',312000,289000,23000);

INSERT INTO trip_lines (id, bill_id, lr_number, trip_date, origin, destination, vehicle_number, vehicle_type, base_amount, extra_charges_json, extraction_confidence) VALUES
  ('t1000001-0001-0001-0001-000000000001','b1000001-0001-0001-0001-000000000001','VRL240601','2025-06-01','Mumbai','Pune','MH01AB1234','14ft',14200,'{}',0.96),
  ('t1000002-0001-0001-0001-000000000002','b1000001-0001-0001-0001-000000000001','VRL240602','2025-06-03','Mumbai','Nashik','MH01AB2345','14ft',15000,'{}',0.98),
  ('t1000003-0001-0001-0001-000000000003','b1000001-0001-0001-0001-000000000001','VRL240603','2025-06-05','Mumbai','Aurangabad','MH04CD3456','17ft',22000,'{"detention":3000}',0.94),
  ('t1000004-0001-0001-0001-000000000004','b1000001-0001-0001-0001-000000000001','VRL240604','2025-06-08','Pune','Hyderabad','MH12EF4567','20ft',32000,'{}',0.97),
  ('t1000005-0001-0001-0001-000000000005','b1000001-0001-0001-0001-000000000001','VRL240605','2025-06-10','Mumbai','Bengaluru','MH04CD5678','20ft',45000,'{}',0.99),
  ('t1000006-0001-0001-0001-000000000006','b1000001-0001-0001-0001-000000000001','VRL240601','2025-06-01','Mumbai','Pune','MH01AB1234','14ft',14200,'{}',0.96),
  ('t1000007-0001-0001-0001-000000000007','b1000001-0001-0001-0001-000000000001','VRL240607','2025-06-15','Mumbai','Surat','MH01IJ7890','14ft',11200,'{}',0.82);

INSERT INTO flags (trip_line_id, flag_type, expected_amount, claimed_amount, description, status) VALUES
  ('t1000001-0001-0001-0001-000000000001','rate_mismatch',12500,14200,'Mumbai→Pune 14ft: contract rate ₹12,500 | billed ₹14,200 | excess ₹1,700','open'),
  ('t1000003-0001-0001-0001-000000000003','detention_invalid',0,3000,'Detention ₹3,000 claimed but no POD attached. Contract allows 2 free days.','disputed'),
  ('t1000006-0001-0001-0001-000000000006','duplicate',14200,14200,'Duplicate of LR# VRL240601 (trip 1). Same transporter, LR, vehicle, date.','open'),
  ('t1000007-0001-0001-0001-000000000007','unknown_lane',NULL,11200,'Mumbai→Surat has no matching rate line in the active VRL contract.','open');
