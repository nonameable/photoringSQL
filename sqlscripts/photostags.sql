# photostags is a table ised when photos have tags.
# Both moma and nba datasets do not have tags
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