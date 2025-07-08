import uuid
from datetime import timezone, datetime

from sqlalchemy import Column, DateTime, String, ForeignKey, text
from sqlalchemy.orm import Session, relationship

from src.database import Base


class Employee(Base):
    __tablename__ = "employee"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    surname = Column(String, nullable=False)
    position = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    team_id = Column(String, ForeignKey("team.id"), nullable=False)

    team = relationship("Team", foreign_keys=[team_id])


class EmployeeService:
    def __init__(self, session: Session):
        self.model = Employee
        self.session = session

    def create(self, **values):
        created_at = datetime.now(timezone.utc)
        employee = self.model(created_at=created_at, **values)
        self.session.add(employee)
        self.session.commit()
        self.session.refresh(employee)
        return employee

    def read(self, employee_id):
        query = f"SELECT * FROM {self.model.__tablename__} WHERE id = '{employee_id}';"
        return self.session.execute(text(query)).fetchone()

    def read_all(self):
        query = f"SELECT * FROM {self.model.__tablename__};"
        return self.session.execute(text(query)).fetchall()

    def read_all_by_team_id(self, team_id):
        query = f"SELECT * FROM {self.model.__tablename__} WHERE team_id = '{team_id}';"
        return self.session.execute(text(query)).fetchall()

    def update(self):
        pass

    def delete(self, employee_id):
        query = f"DELETE FROM {self.model.__tablename__} WHERE id = '{employee_id}';"
        self.session.execute(text(query))
        self.session.commit()
        return True

    def bulk_delete(self, employee_ids):
        ids_str = "', '".join(employee_ids)
        query = f"DELETE FROM {self.model.__tablename__} WHERE id IN ('{ids_str}');"
        self.session.execute(text(query))
        self.session.commit()
        return True
