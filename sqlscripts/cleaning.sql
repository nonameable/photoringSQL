use photoring;

#truncate table photos;
#delete from photos;
#select * from photos where photo_id = 1234;
#SELECT COUNT(*) FROM photos;
# select * from artworks order by length(Title) DESC LIMIT 0,1

-- to see what happens
select substring(Title, 1, 3000) from artworks_substring

-- as max key length is 3072 bytes, and we do not know which string might get that
-- we need to substring the title the minimum while still complying with 
-- max key length. If we need max 4 bytes for every character, then, 768 is the top
-- as the max character length in moma is 777, not much is lost.
update artworks_substring set Title = substring(Title, 1, 768);

# NOT IMAGE FOUND LINK https://i.imgur.com/eKXz0uk.png


UPDATE photoDimension
  SET ThumbnailURL = '//i.imgur.com/eKXz0uk.png'
  WHERE ThumbnailURL = 'https://www.moma.org/'

UPDATE photos
  SET ThumbnailURL = '//i.imgur.com/eKXz0uk.png'
  WHERE ThumbnailURL = 'https://www.moma.org/'