DROP TABLE IF EXISTS library;
CREATE TABLE IF NOT EXISTS library(
  id SERIAL PRIMARY KEY,
  author VARCHAR(255);
  title VARCHAR(255);
  isbn VARCHAR(255);  
  image_url TEXT;
  description TEXT;
  shelf VARCHAR(255);
)