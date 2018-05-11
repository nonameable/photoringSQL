use photoring;
drop table if exists photoDimension;
CREATE TABLE `photoDimension` (
  `photo_id` bigint(50) NOT NULL,
  `dimension_name` varchar(30) NOT NULL,
  `dimension_value` varchar(738) NOT NULL,
  `dimension_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `description` varchar(50) DEFAULT NULL,
  `server` varchar(50) DEFAULT NULL,
  `secret` varchar(50) DEFAULT NULL,
  `URL` varchar(300) DEFAULT NULL,
  `ThumbnailURL` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`dimension_id`),
  KEY `photoDimension_index_photo_id` (`photo_id`),
  KEY `photoDimension_photo_id_dim_name` (`dimension_name`,`photo_id`) USING BTREE,
  KEY `photoDimension_dim_name_and_value` (`dimension_name`,`dimension_value`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=69729241 DEFAULT CHARSET=utf8mb4;

-- inserting data from every dimension

-- Title
INSERT INTO photoDimension
(photo_id, dimension_name, dimension_value, name, description, server, secret, URL, ThumbnailURL)
select
photo_id, "Title" as dimension_name, Title as dimension_value,
photos.Title, photos.description, photos.server, photos.secret, photos.URL, photos.ThumbnailURL
 from photos
 where Title!="" order by dimension_value;

-- Artist
INSERT INTO photoDimension
(photo_id, dimension_name, dimension_value, name, description, server, secret, URL, ThumbnailURL)
select
photo_id, "Artist" as dimension_name, Artist as dimension_value,
photos.Title, photos.description, photos.server, photos.secret, photos.URL, photos.ThumbnailURL
 from photos
 where Artist!="" order by dimension_value;

 -- Nationality
INSERT INTO photoDimension
(photo_id, dimension_name, dimension_value, name, description, server, secret,URL, ThumbnailURL)
select
photo_id, "Nationality" as dimension_name, Nationality as dimension_value,
photos.Title, photos.description, photos.server, photos.secret, photos.URL, photos.ThumbnailURL
 from photos
 where Nationality!="" order by dimension_value;

 -- Gender
INSERT INTO photoDimension
(photo_id, dimension_name, dimension_value, name, description, server, secret,URL, ThumbnailURL)
select
photo_id, "Gender" as dimension_name, Gender as dimension_value,
photos.Title, photos.description, photos.server, photos.secret, photos.URL, photos.ThumbnailURL
 from photos
 where Gender!="" order by dimension_value;

 -- Classification
INSERT INTO photoDimension
(photo_id, dimension_name, dimension_value, name, description, server, secret,URL, ThumbnailURL)
select
photo_id, "Classification" as dimension_name, Classification as dimension_value,
photos.Title, photos.description, photos.server, photos.secret, photos.URL, photos.ThumbnailURL
 from photos
 where Classification!="" order by dimension_value;

 -- Department
INSERT INTO photoDimension
(photo_id, dimension_name, dimension_value, name, description, server, secret,URL, ThumbnailURL)
select
photo_id, "Department" as dimension_name, Department as dimension_value,
photos.Title, photos.description, photos.server, photos.secret, photos.URL, photos.ThumbnailURL
 from photos
 where Department!="" order by dimension_value;


 -- DateAcquired
INSERT INTO photoDimension
(photo_id, dimension_name, dimension_value, name, description, server, secret,URL, ThumbnailURL)
select
photo_id, "DateAcquired" as dimension_name, DateAcquired as dimension_value,
photos.Title, photos.description, photos.server, photos.secret, photos.URL, photos.ThumbnailURL
 from photos
 where DateAcquired!="" order by dimension_value;


 -- Cataloged
INSERT INTO photoDimension
(photo_id, dimension_name, dimension_value, name, description, server, secret,URL, ThumbnailURL)
select
photo_id, "Cataloged" as dimension_name, Cataloged as dimension_value,
photos.Title, photos.description, photos.server, photos.secret, photos.URL, photos.ThumbnailURL
 from photos
 where Cataloged!="" order by dimension_value;

 -- URL
INSERT INTO photoDimension
(photo_id, dimension_name, dimension_value, name, description, server, secret,URL, ThumbnailURL)
select
photo_id, "URL" as dimension_name, URL as dimension_value,
photos.Title, photos.description, photos.server, photos.secret, photos.URL, photos.ThumbnailURL
 from photos
 where URL!="" order by dimension_value;

 -- ThumbnailURL
INSERT INTO photoDimension
(photo_id, dimension_name, dimension_value, name, description, server, secret,URL, ThumbnailURL)
select
photo_id, "ThumbnailURL" as dimension_name, ThumbnailURL as dimension_value,
photos.Title, photos.description, photos.server, photos.secret, photos.URL, photos.ThumbnailURL
 from photos
 where ThumbnailURL!="" order by dimension_value;

 -- Durationsec
INSERT INTO photoDimension
(photo_id, dimension_name, dimension_value, name, description, server, secret,URL, ThumbnailURL)
select
photo_id, "Durationsec" as dimension_name, Durationsec as dimension_value,
photos.Title, photos.description, photos.server, photos.secret, photos.URL, photos.ThumbnailURL
 from photos
 where Durationsec!="" order by dimension_value;

# other tables 

-- dimension counts
drop table if exists dimensionValueCounts;
create table dimensionValueCounts as
select dimension_name, dimension_value, count(*)  as count,
min(dimension_id) as min_dimension_id from photoDimension
group by dimension_name,dimension_value;
CREATE INDEX dimensionValueCounts_dimension_name ON dimensionValueCounts (dimension_name);

-- all tags
set session group_concat_max_len = 4096; -- it could be 3076 = max 3072 comming from dimension name and dim value, and 4 from the colon
drop table if exists photosAllTags;
CREATE TABLE photosAllTags AS
SELECT photo_id,
GROUP_CONCAT(concat(dimension_name, ":", TO_BASE64(dimension_value))) AS all_tags -- I think there is going to be problems with this colon. Maybe another symbol that does not appear in the moma dataset?
FROM photoDimension
GROUP BY 1;
CREATE INDEX photosAllTags_photo_id  ON photosAllTags (photo_id);

DROP TABLE IF EXISTS photoDimensionAllTags;
CREATE TABLE photoDimensionAllTags AS
SELECT * from photoDimension NATURAL JOIN photosAllTags
ORDER BY dimension_id;
CREATE INDEX photoDimensionAllTags_photo_id  ON photoDimensionAllTags (photo_id);
CREATE INDEX photoDimensionAllTags_dimension_id  ON photoDimensionAllTags (dimension_id);

## OTHER SCRIPTS

UPDATE photoDimension as pd, photos as p
  SET pd.URL = p.URL, pd.ThumbnailURL = p.ThumbnailURL
  WHERE pd.photo_id = p.photo_id

# NOT IMAGE FOUND LINK https://i.imgur.com/eKXz0uk.png


UPDATE photoDimension
  SET ThumbnailURL = '//i.imgur.com/eKXz0uk.png'
  WHERE ThumbnailURL = 'https://www.moma.org/'

UPDATE photos
  SET ThumbnailURL = '//i.imgur.com/eKXz0uk.png'
  WHERE ThumbnailURL = 'https://www.moma.org/'

