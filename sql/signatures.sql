DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures
(
    id SERIAL PRIMARY KEY,
    first VARCHAR(200)NOT NULL CHECK (first <> ''),
    last VARCHAR(300) NOT NULL CHECK (last <> ''),
    sig TEXT NOT NULL CHECK (sig <> ''),
    user_id INTEGER REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);