"""
TenantMiddleware – multi-tenancy without login.
Extracts tenant/role from:
  - URL path:    /tenant/{name}/...
  - Query param: ?tenant=pune-haveli
  - Query param: ?role=farmer
Injects into request.state for downstream use.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import re

KNOWN_ROLES = {"farmer", "student", "jobseeker", "general"}

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # ── 1. Extract from URL path: /tenant/{name}  ──────────────────────
        tenant_id = "general"
        role = "general"

        path = request.url.path
        match = re.match(r"^/tenant/([^/]+)", path)
        if match:
            tenant_id = match.group(1)

        # ── 2. Override with query params ──────────────────────────────────
        tenant_param = request.query_params.get("tenant")
        if tenant_param:
            tenant_id = tenant_param

        role_param = request.query_params.get("role")
        if role_param and role_param in KNOWN_ROLES:
            role = role_param

        district_param = request.query_params.get("district", "")

        # ── 3. Inject into request.state ───────────────────────────────────
        request.state.tenant_id = tenant_id
        request.state.tenant_role = role
        request.state.tenant_district = district_param

        response = await call_next(request)

        # ── 4. Add tenant headers to response ─────────────────────────────
        response.headers["X-Tenant-ID"] = tenant_id
        response.headers["X-Tenant-Role"] = role
        return response
