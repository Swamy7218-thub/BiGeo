from typing import Optional, List
from sqlalchemy import String, Text, Integer, Double, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry
from .base import Base


class State(Base):
    __tablename__ = "states"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, unique=True, nullable=False, index=True)
    iso_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    # MultiPolygon to handle states with islands / enclaves
    geom: Mapped[Optional[object]] = mapped_column(
        Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=True
    )

    districts: Mapped[List["District"]] = relationship("District", back_populates="state")
    pincodes: Mapped[List["Pincode"]] = relationship("Pincode", back_populates="state")

    def __repr__(self) -> str:
        return f"<State id={self.id} name={self.name!r}>"


class District(Base):
    __tablename__ = "districts"
    __table_args__ = (
        UniqueConstraint("state_id", "name", name="uq_district_state_name"),
        Index("ix_districts_name_trgm", "name", postgresql_using="gin",
              postgresql_ops={"name": "gin_trgm_ops"}),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    state_id: Mapped[int] = mapped_column(Integer, ForeignKey("states.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    geom: Mapped[Optional[object]] = mapped_column(
        Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=True
    )

    state: Mapped["State"] = relationship("State", back_populates="districts")
    subdistricts: Mapped[List["Subdistrict"]] = relationship("Subdistrict", back_populates="district")
    pincodes: Mapped[List["Pincode"]] = relationship("Pincode", back_populates="district")

    def __repr__(self) -> str:
        return f"<District id={self.id} name={self.name!r} state_id={self.state_id}>"


class Subdistrict(Base):
    """Represents mandal / tehsil / taluk / block depending on state."""

    __tablename__ = "subdistricts"
    __table_args__ = (
        UniqueConstraint("district_id", "name", name="uq_subdistrict_district_name"),
        Index("ix_subdistricts_name_trgm", "name", postgresql_using="gin",
              postgresql_ops={"name": "gin_trgm_ops"}),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    district_id: Mapped[int] = mapped_column(Integer, ForeignKey("districts.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    geom: Mapped[Optional[object]] = mapped_column(
        Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=True
    )

    district: Mapped["District"] = relationship("District", back_populates="subdistricts")
    localities: Mapped[List["Locality"]] = relationship("Locality", back_populates="subdistrict")
    pincodes: Mapped[List["Pincode"]] = relationship("Pincode", back_populates="subdistrict")

    def __repr__(self) -> str:
        return f"<Subdistrict id={self.id} name={self.name!r}>"


class Locality(Base):
    """Village / town / ward — finest level of the administrative hierarchy."""

    __tablename__ = "localities"
    __table_args__ = (
        UniqueConstraint("subdistrict_id", "name", name="uq_locality_subdistrict_name"),
        Index("ix_localities_name_trgm", "name", postgresql_using="gin",
              postgresql_ops={"name": "gin_trgm_ops"}),
        # Spatial index for reverse geocode nearest-locality queries
        Index("ix_localities_geom", "geom", postgresql_using="gist"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    subdistrict_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("subdistricts.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    # village | town | ward | hamlet
    type: Mapped[str] = mapped_column(String(32), nullable=False, default="village")
    lat: Mapped[Optional[float]] = mapped_column(Double, nullable=True)
    lon: Mapped[Optional[float]] = mapped_column(Double, nullable=True)
    # Point geometry derived from lat/lon for spatial queries
    geom: Mapped[Optional[object]] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326), nullable=True
    )

    subdistrict: Mapped["Subdistrict"] = relationship("Subdistrict", back_populates="localities")
    address_points: Mapped[List["AddressPoint"]] = relationship("AddressPoint", back_populates="locality")

    def __repr__(self) -> str:
        return f"<Locality id={self.id} name={self.name!r} type={self.type!r}>"
