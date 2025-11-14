BEGIN;

-- Remover SKUs se já existirem para evitar duplicidades
DELETE FROM materials WHERE sku IN (
  'NJ001M4','S124M4','S124M8','S124M12','S124M16','NJ001','S153A','S179','S178LDF',
  'S183PM-II','S185HS','S185LDF','S185ROF','FITEL-ACC','S218R-Plus','S251A','S326',
  'ID-HR-v3','MT-FERRULE','MT12SM-LL','FITELCLEAN','OFC-ULTRA-SLIM-HCD',
  'OFC-LOOSE-TUBE-ARMORED','OFC-LOOSE-TUBE-LAP','OFC-LOOSE-TUBE-BASE','OFC-LOOSE-TUBE-PE',
  'OFC-RIBBON-SLOTTED-ARMORED','OFC-RIBBON-SLOTTED-BASE','OFC-RIBBON-SLOTTED-LAP','OFC-RIBBON-SLOTTED-PE'
);

-- Inserir itens dos catálogos Furukawa
INSERT INTO materials (name, sku, "unitPrice", "stockQuantity") VALUES
('NJ001M4 Hand-Held Ribbon Fiber Fusion Splicer','NJ001M4',0,10),
('S124M4 Ribbon Fiber Fusion Splicer','S124M4',0,10),
('S124M8 Ribbon Fiber Fusion Splicer','S124M8',0,10),
('S124M12 Ribbon Fiber Fusion Splicer','S124M12',0,10),
('S124M16 Ribbon Fiber Fusion Splicer','S124M16',0,10),
('FITEL NINJA NJ001 Single Fiber Fusion Splicer','NJ001',0,10),
('S153A Hand Held Active Alignment Splicer','S153A',0,10),
('S179 Hand-Held, Core-Alignment Fusion Splicer','S179',0,10),
('S178LDF Core Alignment Large Diameter Fiber Fusion Splicer','S178LDF',0,10),
('S183PM II ver.2 / S184PM-SLDF ver.2 Fusion Splicer','S183PM-II',0,10),
('S185HS / S185PM High-end Fusion Splicer','S185HS',0,10),
('S185LDF / S185PMLDF High-end Fusion Splicer','S185LDF',0,10),
('S185ROF / S185PMROF High-end Fusion Splicer','S185ROF',0,10),
('FITEL Fusion Splicer Accessories and Consumables','FITEL-ACC',0,50),
('S218R-Plus Optical Fiber Stripper','S218R-Plus',0,30),
('S251A Optical Fiber Stripper','S251A',0,30),
('S326 High Precision Optical Fiber Cleaver','S326',0,20),
('Optical Fiber Identifier ID-H/R v3','ID-HR-v3',0,15),
('MT Ferrules','MT-FERRULE',0,50),
('MT12SM-LL Pre-Angled Ferrule','MT12SM-LL',0,40),
('Optical Connector Cleaner FITELCLEAN','FITELCLEAN',0,100),
('Ultra-Slim Cable with Extremely High Core Density','OFC-ULTRA-SLIM-HCD',0,1000),
('Optical Fiber Loose Tube Cable - Armored Direct Buried','OFC-LOOSE-TUBE-ARMORED',0,500),
('Optical Fiber Loose Tube Cable - Laminated Aluminum for Duct','OFC-LOOSE-TUBE-LAP',0,500),
('Optical Fiber Loose Tube Cable - Fundamental Structures','OFC-LOOSE-TUBE-BASE',0,500),
('Optical Fiber Loose Tube Cable - Polyethylene for Duct','OFC-LOOSE-TUBE-PE',0,500),
('Optical Fiber Ribbon Slotted Core Cable - Armored Direct Buried','OFC-RIBBON-SLOTTED-ARMORED',0,500),
('Optical Fiber Ribbon Slotted Core Cable - Fundamental Structures','OFC-RIBBON-SLOTTED-BASE',0,500),
('Optical Fiber Ribbon Slotted Core Cable - Laminated Aluminum for Duct','OFC-RIBBON-SLOTTED-LAP',0,500),
('Optical Fiber Ribbon Slotted Core Cable - Polyethylene for Duct','OFC-RIBBON-SLOTTED-PE',0,500);

COMMIT;