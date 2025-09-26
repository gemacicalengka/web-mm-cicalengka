import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/login.tsx"),
  route("/dashboard", "routes/dashboard.tsx"),
  route("/kegiatan", "routes/kegiatan.tsx"),
  route("/absensi", "routes/absensi.tsx"),
  route("/absensi/edit/:id", "routes/absensi_anakHalaman/absensi.edit.$id.tsx"),
  route("/proses_editData/:id", "routes/absensi_anakHalaman/proses_editData.tsx"),
  route("/proses_tambahData", "routes/absensi_anakHalaman/proses_tambahData.tsx"),
  route("/database", "routes/database.tsx"),
  route("/database/tambah", "routes/database_anakHalaman/database.tambah.tsx"),
  route("/database/edit/:id", "routes/database_anakHalaman/database.edit.$id.tsx"),
  route("/laporan", "routes/laporan.tsx"),
  route("/informasi", "routes/informasi.tsx"),
] satisfies RouteConfig;
//
