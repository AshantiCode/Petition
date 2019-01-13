DROP TABLE IF EXISTS signatures

CREATE TABLE signatures
(
    id SERIAL PRIMARY KEY,
    userFirsName VARCHAR(200)NOT NULL CHECK (userFirstName <> ''),
    userLastName VARCHAR(300) NOT NULL CHECK (userLastName <> ''),
    sig TEXT NOT NULL CHECK (sig <> ''),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

)