from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .db import Base


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(200), nullable=True)
    phone = Column(String(50), nullable=True)
    status = Column(String(50), nullable=False, default="new")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    activities = relationship("Activity", back_populates="lead", cascade="all, delete-orphan")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    leadId = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    lead = relationship("Lead", back_populates="activities")