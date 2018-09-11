use nba_photoring;
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
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

-- inserting data from every dimensionin the dataset that you want
-- TODO: This needs to be automated using config files

-- Title
INSERT INTO photoDimension
(photo_id, dimension_name, dimension_value, name, description, server, secret, URL, ThumbnailURL)
select
photo_id, "Title" as dimension_name, Title as dimension_value,
photos.Title, photos.description, photos.server, photos.secret, photos.URL, photos.ThumbnailURL
 from photos
 where Title!="" order by dimension_value;



# other tables needed for photoring to work

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