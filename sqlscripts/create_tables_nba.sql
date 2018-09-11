use nba_photoring;
drop table if exists photos;

# we need to automate this

create table photos (
  photo_id VARCHAR(52) PRIMARY KEY,
  name VARCHAR(50),
  games_played VARCHAR(50),
  min varchar(50),
  pts varchar(50),
  oreb varchar(50),
  dreb varchar(50),
  age varchar(50),
  birth_place varchar(50),
  birth_date varchar(50),
  college varchar(50),
  experience varchar(50),
  height varchar(50),
  team varchar(50),
  weight varchar(50),
  bmi varchar(50),
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
