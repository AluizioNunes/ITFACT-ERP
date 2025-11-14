from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from ..db import get_session
from .. import models
from datetime import datetime, timedelta, timezone

router = APIRouter()


class Lead(BaseModel):
  name: str
  email: str | None = None
  phone: str | None = None
  status: str = "new"  # new, contacted, qualified, won, lost


class Activity(BaseModel):
  leadId: str
  type: str  # call, meeting, email
  notes: str | None = None


@router.post("/leads")
async def create_lead(lead: Lead, session: AsyncSession = Depends(get_session)):
  obj = models.Lead(name=lead.name, email=lead.email, phone=lead.phone, status=lead.status)
  session.add(obj)
  await session.commit()
  await session.refresh(obj)
  return {"id": obj.id}


@router.get("/leads")
async def list_leads(session: AsyncSession = Depends(get_session)):
  result = await session.execute(select(models.Lead).order_by(models.Lead.id.desc()))
  items = []
  for l in result.scalars().all():
    items.append({
      "id": l.id,
      "name": l.name,
      "email": l.email,
      "phone": l.phone,
      "status": l.status,
      "created_at": l.created_at,
    })
  return items


@router.put("/leads/{id}")
async def update_lead(id: int, lead: Lead, session: AsyncSession = Depends(get_session)):
  obj = await session.get(models.Lead, id)
  if not obj:
    raise HTTPException(status_code=404, detail="Lead not found")
  obj.name = lead.name
  obj.email = lead.email
  obj.phone = lead.phone
  obj.status = lead.status
  await session.commit()
  await session.refresh(obj)
  return {
    "id": obj.id,
    "name": obj.name,
    "email": obj.email,
    "phone": obj.phone,
    "status": obj.status,
  }


@router.delete("/leads/{id}")
async def delete_lead(id: int, session: AsyncSession = Depends(get_session)):
  await session.execute(delete(models.Activity).where(models.Activity.leadId == id))
  obj = await session.get(models.Lead, id)
  if not obj:
    raise HTTPException(status_code=404, detail="Lead not found")
  await session.delete(obj)
  await session.commit()
  return {"deleted": True}


@router.post("/activities")
async def create_activity(activity: Activity, session: AsyncSession = Depends(get_session)):
  obj = models.Activity(leadId=int(activity.leadId), type=activity.type, notes=activity.notes)
  session.add(obj)
  await session.commit()
  await session.refresh(obj)
  return {"id": obj.id}


@router.get("/activities/{leadId}")
async def list_activities(leadId: int, session: AsyncSession = Depends(get_session)):
  result = await session.execute(
    select(models.Activity).where(models.Activity.leadId == leadId).order_by(models.Activity.id.desc())
  )
  items = []
  for a in result.scalars().all():
    items.append({
      "id": a.id,
      "leadId": a.leadId,
      "type": a.type,
      "notes": a.notes,
      "created_at": a.created_at,
    })
  return items


@router.get("/stats")
async def stats(
  session: AsyncSession = Depends(get_session),
  days: int | None = Query(None, ge=1, description="Contar últimos N dias"),
  start: str | None = Query(None, alias="from", description="Data inicial ISO"),
  end: str | None = Query(None, description="Data final ISO"),
):
  now = datetime.now(timezone.utc)

  start_dt: datetime | None = None
  end_dt: datetime | None = None

  if days:
    start_dt = now - timedelta(days=days)
    end_dt = now
  else:
    def parse_iso(s: str | None) -> datetime | None:
      if not s:
        return None
      try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
      except Exception:
        return None
    start_dt = parse_iso(start)
    end_dt = parse_iso(end) or now if (start_dt or end) else None

  q_leads = select(func.count()).select_from(models.Lead)
  q_acts = select(func.count()).select_from(models.Activity)

  if start_dt:
    q_leads = q_leads.where(models.Lead.created_at >= start_dt)
    q_acts = q_acts.where(models.Activity.created_at >= start_dt)
  if end_dt:
    q_leads = q_leads.where(models.Lead.created_at < end_dt)
    q_acts = q_acts.where(models.Activity.created_at < end_dt)

  leads_count = await session.scalar(q_leads)
  activities_count = await session.scalar(q_acts)
  return {"leads": int(leads_count or 0), "activities": int(activities_count or 0)}