## OTHER SCRIPTS

# These scripts are not necessary to run photoring
UPDATE photoDimension as pd, photos as p
  SET pd.URL = p.URL, pd.ThumbnailURL = p.ThumbnailURL
  WHERE pd.photo_id = p.photo_id


