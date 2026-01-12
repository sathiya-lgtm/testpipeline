#Create scripts :
#================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(150)
);

CREATE OR REPLACE FUNCTION get_user_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM users);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE PROCEDURE insert_user(p_name VARCHAR, p_email VARCHAR)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO users(name, email)
    VALUES (p_name, p_email);
END;
$$;

CREATE TABLE employee (
    id SERIAL PRIMARY KEY,
    name TEXT,
    salary NUMERIC
);



#Modify Scripts:
#===============
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(150),
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

CREATE OR REPLACE FUNCTION get_user_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM users WHERE status = 'ACTIVE');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_by_email(p_email VARCHAR)
RETURNS TABLE(id INT, name VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.name FROM users u WHERE u.email = p_email;
END;
$$ LANGUAGE plpgsql;