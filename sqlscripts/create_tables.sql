use photoring;
drop table if exists photos;
create table photos (
  photo_id VARCHAR(52) PRIMARY KEY,
  secret VARCHAR(50),
  server VARCHAR(50),
  name VARCHAR(50),
  description VARCHAR(50 ),
  count_comments VARCHAR(50),
  count_notes VARCHAR(50 ),
  count_tags VARCHAR(50),
  count_faves VARCHAR(50 ),
  count_views VARCHAR(50 ),
  has_geo VARCHAR(50 ),
  date_imported INT(50),
  date_create INT(50),
  date_taken VARCHAR(50),
  date_taken_granularity VARCHAR(50),
  perms VARCHAR(50 ),
  camera VARCHAR(50),
  content_type VARCHAR(50),
  ispub VARCHAR(50 ),
  isfrnd VARCHAR(50),
  isfam VARCHAR(50 ),
  isfrndfam VARCHAR(50),
  date_create_month INT(8),
  date_create_year INT(8),
  is_video INT(2),
  Title varchar(738),
  Artist varchar(738),
  ConstituentID varchar(738),
  Nationality varchar(738),
  Gender varchar(738),
  Classification varchar(738),
  Department varchar(738),
  DateAcquired varchar(50),
  Cataloged varchar(50),
  URL varchar(300),
  ThumbnailURL varchar(300),
  Durationsec varchar(50)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

drop table if exists photostags;
create table photostags (
  photo_id              bigint,
  photo_id_again        bigint,
  tag_id                bigint,
  owner_id              bigint,
  photo_perms           int,
  tag_creator_id        bigint,
  date_create           int,
  in_order              int,
  tag_raw               varchar(50)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;