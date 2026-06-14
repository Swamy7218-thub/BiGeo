from typing import Optional
from decimal import Decimal
from sqlalchemy import String, Text, Integer, Double, Numeric, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, TimestampMixin


class AddressPoint(Base, TimestampMixin):
    """Operational address points collected from delivery / partner uploads."""

    __tablename__ = "address_points"
    __table_args__ = (
        Index("ix_ap_pincode_id", "pincode_id"),
        Index("ix_ap_locality_id", "locality_id"),
        # Full-text search on raw_text
        Index("ix_ap_raw_text_fts", "raw_text", postgresql_using="gin",
              postgresql_ops={"raw_text": "gin_trgm_ops"}),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    pincode_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("pincodes.id", ondelete="SET NULL"), nullable=True
    )
    locality_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("localities.id", ondelete="SET NULL"), nullable=True
    )

    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    house: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    street: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    landmark: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    lat: Mapped[Optional[float]] = mapped_column(Double, nullable=True)
    lon: Mapped[Optional[float]] = mapped_column(Double, nullable=True)

    # delivery_app | partner_upload | manual | api_geocode
    source: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    quality_score: Mapped[Decimal] = mapped_column(Numeric(4, 3), nullable=False, default=Decimal("0.0"))

    pincode: Mapped[Optional["Pincode"]] = relationship("Pincode", back_populates="address_points")
    locality: Mapped[Optional["Locality"]] = relationship("Locality", back_populates="address_points")

    def __repr__(self) -> str:
        return f"<AddressPoint id={self.id} raw={self.raw_text[:40]!r}>"
