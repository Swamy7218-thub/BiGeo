from typing import Optional, List
from sqlalchemy import String, Text, Integer, Double, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry
from .base import Base


class Pincode(Base):
    __tablename__ = "pincodes"
    __table_args__ = (
        UniqueConstraint("code", "officename", name="uq_pincode_code_office"),
        Index("ix_pincodes_code", "code"),  # fast lookup by 6-digit code
        Index("ix_pincodes_geom", "geom", postgresql_using="gist"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(6), nullable=False)
    officename: Mapped[str] = mapped_column(Text, nullable=False)
    office_type: Mapped[Optional[str]] = mapped_column(Text, nullable=True)    # HO | SO | BO
    delivery_status: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Delivery | Non-Delivery
    division: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    region: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    circle: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Administrative hierarchy foreign keys (nullable — we may not always resolve them)
    state_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("states.id", ondelete="SET NULL"), nullable=True
    )
    district_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("districts.id", ondelete="SET NULL"), nullable=True
    )
    subdistrict_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("subdistricts.id", ondelete="SET NULL"), nullable=True
    )

    lat: Mapped[Optional[float]] = mapped_column(Double, nullable=True)
    lon: Mapped[Optional[float]] = mapped_column(Double, nullable=True)
    # Point or Polygon; typically a Point centroid from raw dataset
    geom: Mapped[Optional[object]] = mapped_column(
        Geometry(geometry_type="GEOMETRY", srid=4326), nullable=True
    )

    state: Mapped[Optional["State"]] = relationship("State", back_populates="pincodes")
    district: Mapped[Optional["District"]] = relationship("District", back_populates="pincodes")
    subdistrict: Mapped[Optional["Subdistrict"]] = relationship("Subdistrict", back_populates="pincodes")
    address_points: Mapped[List["AddressPoint"]] = relationship("AddressPoint", back_populates="pincode")

    def __repr__(self) -> str:
        return f"<Pincode code={self.code!r} office={self.officename!r}>"
