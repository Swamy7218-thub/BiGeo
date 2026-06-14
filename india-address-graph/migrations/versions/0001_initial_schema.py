"""Initial schema — India Address Graph

Revision ID: 0001
Revises:
Create Date: 2025-01-01 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostGIS and trigram extensions
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gin")

    # ── states ────────────────────────────────────────────────────────────
    op.create_table(
        "states",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("name", sa.Text, nullable=False, unique=True),
        sa.Column("iso_code", sa.String(10), nullable=True),
        sa.Column("geom", Geometry("MULTIPOLYGON", srid=4326), nullable=True),
    )
    op.create_index("ix_states_name", "states", ["name"])

    # ── districts ─────────────────────────────────────────────────────────
    op.create_table(
        "districts",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("state_id", sa.Integer,
                  sa.ForeignKey("states.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("geom", Geometry("MULTIPOLYGON", srid=4326), nullable=True),
        sa.UniqueConstraint("state_id", "name", name="uq_district_state_name"),
    )
    op.create_index(
        "ix_districts_name_trgm", "districts", ["name"],
        postgresql_using="gin", postgresql_ops={"name": "gin_trgm_ops"},
    )

    # ── subdistricts ──────────────────────────────────────────────────────
    op.create_table(
        "subdistricts",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("district_id", sa.Integer,
                  sa.ForeignKey("districts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("geom", Geometry("MULTIPOLYGON", srid=4326), nullable=True),
        sa.UniqueConstraint("district_id", "name", name="uq_subdistrict_district_name"),
    )
    op.create_index(
        "ix_subdistricts_name_trgm", "subdistricts", ["name"],
        postgresql_using="gin", postgresql_ops={"name": "gin_trgm_ops"},
    )

    # ── localities ────────────────────────────────────────────────────────
    op.create_table(
        "localities",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("subdistrict_id", sa.Integer,
                  sa.ForeignKey("subdistricts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("type", sa.String(32), nullable=False, server_default="village"),
        sa.Column("lat", sa.Double, nullable=True),
        sa.Column("lon", sa.Double, nullable=True),
        sa.Column("geom", Geometry("POINT", srid=4326), nullable=True),
        sa.UniqueConstraint("subdistrict_id", "name", name="uq_locality_subdistrict_name"),
    )
    op.create_index(
        "ix_localities_name_trgm", "localities", ["name"],
        postgresql_using="gin", postgresql_ops={"name": "gin_trgm_ops"},
    )
    op.create_index("ix_localities_geom", "localities", ["geom"], postgresql_using="gist")

    # ── pincodes ──────────────────────────────────────────────────────────
    op.create_table(
        "pincodes",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("code", sa.String(6), nullable=False),
        sa.Column("officename", sa.Text, nullable=False),
        sa.Column("office_type", sa.Text, nullable=True),
        sa.Column("delivery_status", sa.Text, nullable=True),
        sa.Column("division", sa.Text, nullable=True),
        sa.Column("region", sa.Text, nullable=True),
        sa.Column("circle", sa.Text, nullable=True),
        sa.Column("state_id", sa.Integer,
                  sa.ForeignKey("states.id", ondelete="SET NULL"), nullable=True),
        sa.Column("district_id", sa.Integer,
                  sa.ForeignKey("districts.id", ondelete="SET NULL"), nullable=True),
        sa.Column("subdistrict_id", sa.Integer,
                  sa.ForeignKey("subdistricts.id", ondelete="SET NULL"), nullable=True),
        sa.Column("lat", sa.Double, nullable=True),
        sa.Column("lon", sa.Double, nullable=True),
        sa.Column("geom", Geometry("GEOMETRY", srid=4326), nullable=True),
        sa.UniqueConstraint("code", "officename", name="uq_pincode_code_office"),
    )
    op.create_index("ix_pincodes_code", "pincodes", ["code"])
    op.create_index("ix_pincodes_geom", "pincodes", ["geom"], postgresql_using="gist")

    # ── address_points ────────────────────────────────────────────────────
    op.create_table(
        "address_points",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("pincode_id", sa.Integer,
                  sa.ForeignKey("pincodes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("locality_id", sa.Integer,
                  sa.ForeignKey("localities.id", ondelete="SET NULL"), nullable=True),
        sa.Column("raw_text", sa.Text, nullable=False),
        sa.Column("house", sa.Text, nullable=True),
        sa.Column("street", sa.Text, nullable=True),
        sa.Column("landmark", sa.Text, nullable=True),
        sa.Column("lat", sa.Double, nullable=True),
        sa.Column("lon", sa.Double, nullable=True),
        sa.Column("source", sa.String(64), nullable=True),
        sa.Column("quality_score", sa.Numeric(4, 3), nullable=False, server_default="0.0"),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_ap_pincode_id", "address_points", ["pincode_id"])
    op.create_index("ix_ap_locality_id", "address_points", ["locality_id"])
    op.create_index(
        "ix_ap_raw_text_fts", "address_points", ["raw_text"],
        postgresql_using="gin", postgresql_ops={"raw_text": "gin_trgm_ops"},
    )


def downgrade() -> None:
    op.drop_table("address_points")
    op.drop_table("pincodes")
    op.drop_table("localities")
    op.drop_table("subdistricts")
    op.drop_table("districts")
    op.drop_table("states")
    op.execute("DROP EXTENSION IF EXISTS pg_trgm")
    op.execute("DROP EXTENSION IF EXISTS btree_gin")
    # Note: do NOT drop postgis here as it may be shared
