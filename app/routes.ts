import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/dashboard.tsx"),
  route("/kegiatan", "routes/kegiatan.tsx"),
  route("/absensi", "routes/absensi.tsx"),
  route("/database", "routes/database.tsx"),
  route("/database/tambah", "routes/database.tambah.tsx"),
  route("/database/edit/:id", "routes/database.edit.$id.tsx"),
  route("/laporan", "routes/laporan.tsx"),
] satisfies RouteConfig;
