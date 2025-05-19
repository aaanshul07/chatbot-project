
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL
);


CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,  -- NULL for guest/developer data
    question TEXT,
    answer TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  question TEXT,
  answer TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS default_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question TEXT,
  answer TEXT
);

CREATE TABLE IF NOT EXISTS guest_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question TEXT,
  answer TEXT
);