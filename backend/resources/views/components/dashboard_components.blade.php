 @extends('app')
 @section('content')

 <div class="row">
                <!-- Total Karyawan -->
                <div class="col-md-6 col-xl-3">
                    <div class="card bg-grd-primary order-card">
                        <div class="card-body">
                            <h6 class="text-white">Total Karyawan</h6>
                            <h2 class="text-end text-white">
                                <i class="feather icon-users float-start"></i>
                                <span>{{ $totalKaryawan ?? 0 }}</span>
                            </h2>
                            <p class="m-b-0">Aktif<span class="float-end">{{ $karyawanAktif ?? 0 }}</span></p>
                        </div>
                    </div>
                </div>

                <!-- Hadir Hari Ini -->
                <div class="col-md-6 col-xl-3">
                    <div class="card bg-grd-success order-card">
                        <div class="card-body">
                            <h6 class="text-white">Hadir Hari Ini</h6>
                            <h2 class="text-end text-white">
                                <i class="feather icon-check-circle float-start"></i>
                                <span>{{ $hadirHariIni ?? 0 }}</span>
                            </h2>
                            <p class="m-b-0">On Time<span class="float-end">{{ $tepatWaktu ?? 0 }}</span></p>
                        </div>
                    </div>
                </div>

                <!-- Terlambat -->
                <div class="col-md-6 col-xl-3">
                    <div class="card bg-grd-warning order-card">
                        <div class="card-body">
                            <h6 class="text-white">Terlambat</h6>
                            <h2 class="text-end text-white">
                                <i class="feather icon-clock float-start"></i>
                                <span>{{ $terlambat ?? 0 }}</span>
                            </h2>
                            <p class="m-b-0">Hari Ini</p>
                        </div>
                    </div>
                </div>

                <!-- Tidak Hadir -->
                <div class="col-md-6 col-xl-3">
                    <div class="card bg-grd-danger order-card">
                        <div class="card-body">
                            <h6 class="text-white">Tidak Hadir</h6>
                            <h2 class="text-end text-white">
                                <i class="feather icon-x-circle float-start"></i>
                                <span>{{ $tidakHadir ?? 0 }}</span>
                            </h2>
                            <p class="m-b-0">Hari Ini</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 col-xl-7">
                    <div class="card">
                        <div class="card-header">
                            <h5>Peta Lokasi Absensi</h5>
                        </div>
                        <div class="card-body">
                            <div id="world-map-markers" class="set-map" style="height: 365px"></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 col-xl-5">
                    <div class="card">
                        <div class="card-header d-flex align-items-center justify-content-between py-3">
                            <h5>Statistik Kehadiran Karyawan</h5>
                            <div class="dropdown">
                                <a class="avtar avtar-xs btn-link-secondary dropdown-toggle arrow-none" href="#"
                                    data-bs-toggle="dropdown">
                                    <i class="material-icons-two-tone f-18">more_vert</i>
                                </a>
                                <div class="dropdown-menu dropdown-menu-end">
                                    <a class="dropdown-item" href="#">Detail</a>
                                    <a class="dropdown-item" href="#">Export</a>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="media align-items-center">
                                <div class="avtar avtar-s bg-light-primary flex-shrink-0">
                                    <i class="ph ph-user-check f-20"></i>
                                </div>
                                <div class="media-body ms-3">
                                    <p class="mb-0 text-muted">Total Kehadiran Bulan Ini</p>
                                    <h5 class="mb-0">128 Kehadiran</h5>
                                </div>
                            </div>
                            <div class="mt-4 text-center text-muted">
                                <div class="mt-4">
                                    <canvas id="attendanceMonthlyChart" height="80"></canvas>
                                </div>

                            </div>
                        </div>
                    </div>

                    <!-- Ringkasan Kehadiran -->
                    <div class="card">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-4">
                                    <div class="media align-items-center">
                                        <div class="avtar avtar-s flex-shrink-0"
                                            style="background: rgba(40, 167, 69, 0.7);">
                                            <i class="ph ph-check-circle f-20 text-white"></i>
                                        </div>
                                        <div class="media-body ms-2">
                                            <p class="mb-0 text-muted">Hadir</p>
                                            <h6 class="mb-0">96</h6>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="media align-items-center">
                                        <div class="avtar avtar-s flex-shrink-0"
                                            style="background: rgba(255, 193, 7, 0.7);">
                                            <i class="ph ph-clock f-20 text-white"></i>
                                        </div>
                                        <div class="media-body ms-2">
                                            <p class="mb-0 text-muted">Terlambat</p>
                                            <h6 class="mb-0">32</h6>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="media align-items-center">
                                        <div class="avtar avtar-s flex-shrink-0"
                                            style="background: rgba(220, 53, 69, 0.7);">
                                            <i class="ph ph-x-circle f-20 text-white"></i>
                                        </div>
                                        <div class="media-body ms-2">
                                            <p class="mb-0 text-muted">Tidak Hadir</p>
                                            <h6 class="mb-0">12</h6>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {{-- table riwayat --}}

                <div class="col-sm-12">
                    <div class="card table-card">
                        <div class="card-header">
                            <h5>Riwayat Absensi Terbaru</h5>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Foto Wajah</th>
                                            <th>NIK</th>
                                            <th>Nama Karyawan</th>
                                            <th>Waktu Absen</th>
                                            <th>Status</th>
                                            <th>Lokasi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- DATA DUMMY -->
                                        <tr>
                                            <td>
                                                <img src="../assets/images/avatar/avatar-1.jpg" class="rounded-circle"
                                                    width="40" alt="foto">
                                            </td>
                                            <td>EMP001</td>
                                            <td>Andi Pratama</td>
                                            <td>2025-01-15 07:58</td>
                                            <td><span class="badge bg-success">Hadir</span></td>
                                            <td>Cabang Cianjur</td>
                                        </tr>

                                        <tr>
                                            <td>
                                                <img src="../assets/images/avatar/avatar-2.jpg" class="rounded-circle"
                                                    width="40" alt="foto">
                                            </td>
                                            <td>EMP002</td>
                                            <td>Siti Aisyah</td>
                                            <td>2025-01-15 08:12</td>
                                            <td><span class="badge bg-warning">Terlambat</span></td>
                                            <td>Cabang Cianjur Selatan</td>
                                        </tr>

                                        <tr>
                                            <td>
                                                <img src="../assets/images/avatar/avatar-3.jpg" class="rounded-circle"
                                                    width="40" alt="foto">
                                            </td>
                                            <td>EMP003</td>
                                            <td>Budi Santoso</td>
                                            <td>2025-01-15 00:00</td>
                                            <td><span class="badge bg-primary">Izin</span></td>
                                            <td>-</td>
                                        </tr>

                                        <tr>
                                            <td>
                                                <img src="../assets/images/avatar/avatar-4.jpg" class="rounded-circle"
                                                    width="40" alt="foto">
                                            </td>
                                            <td>EMP004</td>
                                            <td>Dewi Lestari</td>
                                            <td>2025-01-15 00:00</td>
                                            <td><span class="badge bg-danger">Alpha</span></td>
                                            <td>-</td>
                                        </tr>

                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Orders end -->
            </div>

                 
 @endsection
 