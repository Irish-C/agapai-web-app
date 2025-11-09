# backend/models.py
from database import db

# Python version of the 'roles' table
class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.BigInteger, primary_key=True)
    role_name = db.Column(db.String(50), unique=True, nullable=False)

# Python version of the 'users' table
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.BigInteger, primary_key=True)
    firstname = db.Column(db.String(100))
    lastname = db.Column(db.String(100))
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)  # HASHED password
    role_id = db.Column(db.BigInteger, db.ForeignKey('roles.id'))
    
    # Relationship 'shortcut', not a column
    role = db.relationship('Role', backref=db.backref('users', lazy=True))

# Models for other tables

class Location(db.Model):
    __tablename__ = 'location'
    id = db.Column(db.BigInteger, primary_key=True)
    loc_name = db.Column(db.String(100), unique=True, nullable=False)

class EventType(db.Model):
    __tablename__ = 'event_type'
    id = db.Column(db.BigInteger, primary_key=True)
    event_type_name = db.Column(db.String(50), unique=True, nullable=False)

class EventClass(db.Model):
    __tablename__ = 'event_class'
    id = db.Column(db.BigInteger, primary_key=True)
    class_name = db.Column(db.String(100), nullable=False)
    event_type_id = db.Column(db.BigInteger, db.ForeignKey('event_type.id'), nullable=False)
    
    event_type = db.relationship('EventType', backref=db.backref('classes', lazy=True))

class Camera(db.Model):
    __tablename__ = 'camera'
    id = db.Column(db.BigInteger, primary_key=True)
    cam_name = db.Column(db.String(100), nullable=False)
    cam_status = db.Column(db.Boolean, default=True)
    stream_url = db.Column(db.String(255))
    loc_id = db.Column(db.BigInteger, db.ForeignKey('location.id'))
    
    location = db.relationship('Location', backref=db.backref('cameras', lazy=True))

class EventLog(db.Model):
    __tablename__ = 'event_logs'
    id = db.Column(db.BigInteger, primary_key=True)
    timestamp = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())
    event_status = db.Column(db.String(50), default='unacknowledged')
    file_path = db.Column(db.String(255))
    cam_id = db.Column(db.BigInteger, db.ForeignKey('camera.id'))
    event_class_id = db.Column(db.BigInteger, db.ForeignKey('event_class.id'))
    ack_by_user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=True)
    
    camera = db.relationship('Camera', backref=db.backref('logs', lazy=True))
    event_class = db.relationship('EventClass', backref=db.backref('logs', lazy=True))
    acknowledged_by = db.relationship('User', backref=db.backref('acknowledged_logs', lazy=True))