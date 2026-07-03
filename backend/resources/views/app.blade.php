<!doctype html>
<html lang="en">

<head>
    <title>Absensi Mendunia</title>

    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0, minimal-ui" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="description" content="Absensi Karyawan Mendunia - Face Recognition & Geolokasi" />
    <meta name="keywords" content="absensi, karyawan, face recognition, geolokasi" />
    <meta name="author" content="Mendunia" />

    <link rel="icon" href="{{ asset('assets/images/logo/logo-sm.png') }}" type="image/png">

    <link rel="stylesheet" href="../assets/css/plugins/jsvectormap.min.css" />
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="../assets/fonts/tabler-icons.min.css" />
    <link rel="stylesheet" href="../assets/fonts/feather.css" />
    <link rel="stylesheet" href="../assets/fonts/fontawesome.css" />
    <link rel="stylesheet" href="../assets/fonts/material.css" />
    <link rel="stylesheet" href="../assets/css/style.css" id="main-style-link" />
    <link rel="stylesheet" href="../assets/css/style-preset.css" />
    <link rel="stylesheet" href="../assets/css/custom.css" />

</head>

<body>
    <script>
        (function() {
            var saved = localStorage.getItem('layout-style') || 'minimal';
            if (saved !== 'minimal') saved = 'minimal';
            localStorage.setItem('layout-style', saved);
            document.body.classList.add('layout-' + saved);
        })();
    </script>
    <div class="loader-bg">
        <div class="loader-track">
            <div class="loader-fill"></div>
        </div>
    </div>

    @include('components.header')

    @include('components.layout-sidebar')

    @php
        $hour = now()->format('H');
        if ($hour < 10) $greeting = 'pagi';
        elseif ($hour < 15) $greeting = 'siang';
        elseif ($hour < 18) $greeting = 'sore';
        else $greeting = 'malam';
    @endphp

    <div class="top-bar" id="topBar">
        <div class="top-bar-left">
            <button class="top-bar-menu-toggle" id="topBarMenuToggle">
                <i class="ph ph-list"></i>
            </button>
            <div class="top-bar-greeting">
                <span class="greeting-text">Selamat {{ $greeting ?? 'siang' }},</span>
                <span class="greeting-name">{{ Auth::user()->name }}</span>
            </div>
        </div>
        <div class="top-bar-center">
            <div class="top-bar-search">
                <i class="ph ph-magnifying-glass"></i>
                <input type="text" placeholder="Cari menu atau fitur..." id="topSearch" />
                <kbd class="search-hint">Ctrl+K</kbd>
            </div>
        </div>
        <div class="top-bar-right">
            <div class="header-dropdown">
                <button class="top-bar-icon dropdown-trigger" title="Notifikasi">
                    <i class="ph ph-bell"></i>
                    @php
                        $totalNotifTop = (isset($notifIzin) ? $notifIzin->count() : 0) + (isset($notifLembur) ? $notifLembur->count() : 0);
                    @endphp
                    @if ($totalNotifTop > 0)
                        <span class="notif-dot top-notif-dot">{{ $totalNotifTop }}</span>
                    @else
                        <span class="notif-dot top-notif-dot no-notif" style="display:none;">0</span>
                    @endif
                </button>
                <div class="dropdown-menu-custom dropdown-menu-right dropdown-menu-notif">
                    <div class="dropdown-header-custom">
                        <span>Notifikasi</span>
                        <span class="notif-header-badge">{{ $totalNotifTop }} baru</span>
                    </div>
                    <div class="dropdown-body-custom">
                        @if ((isset($notifIzin) && $notifIzin->count() > 0) || (isset($notifLembur) && $notifLembur->count() > 0))
                            @isset($notifIzin)
                                @foreach ($notifIzin as $item)
                                    <a href="{{ url('/izin-cuti') }}" class="dropdown-item-custom">
                                        <span class="notif-icon {{ $item->jenis_izin == 'SAKIT' ? 'notif-icon-danger' : 'notif-icon-primary' }}">
                                            <i class="ph ph-file-text"></i>
                                        </span>
                                        <div class="notif-content">
                                            <p><strong>{{ $item->user->name }}</strong> mengajukan {{ $item->jenis_izin }}</p>
                                            <small>{{ $item->created_at->diffForHumans() }}</small>
                                        </div>
                                    </a>
                                @endforeach
                            @endisset
                            @isset($notifLembur)
                                @foreach ($notifLembur as $lembur)
                                    <a href="{{ url('/approval-lembur') }}" class="dropdown-item-custom">
                                        <span class="notif-icon notif-icon-warning">
                                            <i class="ph ph-timer"></i>
                                        </span>
                                        <div class="notif-content">
                                            <p><strong>{{ $lembur->user->name }}</strong> mengajukan Lembur</p>
                                            <small>{{ $lembur->created_at->diffForHumans() }}</small>
                                        </div>
                                    </a>
                                @endforeach
                            @endisset
                        @else
                            <div class="empty-state">
                                <i class="ph ph-bell-slash"></i>
                                <p>Tidak ada pengajuan baru</p>
                            </div>
                        @endif
                    </div>
                    <div class="dropdown-footer-custom">
                        <a href="{{ url('/izin-cuti') }}">Lihat Semua Izin</a>
                        <a href="{{ url('/approval-lembur') }}">Lihat Semua Lembur</a>
                    </div>
                </div>
            </div>
            <div class="header-dropdown">
                <a href="#" class="top-bar-profile dropdown-trigger">
                    <img src="{{ Auth::user()->foto_profil ? asset('uploads/profil/' . Auth::user()->foto_profil) : asset('assets/images/user/avatar-2.jpg') }}" alt="avatar" />
                    <div class="top-bar-profile-info">
                        <span class="profile-name">{{ Auth::user()->name }}</span>
                        <span class="profile-role">{{ Auth::user()->role }}</span>
                    </div>
                    <i class="ph ph-caret-down profile-caret"></i>
                </a>
                <div class="dropdown-menu-custom dropdown-menu-right dropdown-menu-profile">
                    <div class="profile-card-header">
                        <img src="{{ Auth::user()->foto_profil ? asset('uploads/profil/' . Auth::user()->foto_profil) : asset('assets/images/user/avatar-2.jpg') }}" alt="avatar" />
                        <div>
                            <span class="profile-card-name">{{ Auth::user()->name }}</span>
                            <span class="profile-card-role">{{ Auth::user()->role }}</span>
                        </div>
                    </div>
                    <div class="dropdown-divider-custom"></div>
                    <a href="/pengaturan" class="dropdown-item-custom"><i class="ph ph-user-gear"></i> Manajemen Akun</a>
                    <div class="dropdown-divider-custom"></div>
                    <a href="#" class="dropdown-item-custom dropdown-item-logout" id="btnLogoutTop"><i class="ph ph-sign-out"></i> Logout</a>
                </div>
            </div>
        </div>
    </div>

    <div class="main-content">
        <div>
            @yield('contentTask')
        </div>
        <div class="p-4">
            @yield('content')
        </div>
    </div>

    <footer class="main-footer">
        <div class="container-fluid">
            <div class="row align-items-center">
                <div class="col-sm-6 my-1">
                    <p class="m-0">
                        &copy; <span id="year"></span>
                        <strong>Mendunia Absensi</strong>
                        | Face Recognition & Geolokasi
                    </p>
                </div>
                <div class="col-sm-6 ms-auto my-1">
                    <ul class="list-inline footer-link mb-0 justify-content-sm-end d-flex">
                        <li class="list-inline-item"><a href="#">Dashboard</a></li>
                        <li class="list-inline-item"><a href="#">Riwayat Absensi</a></li>
                        <li class="list-inline-item"><a href="#">Profil</a></li>
                    </ul>
                </div>
            </div>
        </div>
    </footer>

    <script>
        document.getElementById('year').textContent = new Date().getFullYear();
    </script>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="../assets/js/plugins/apexcharts.min.js"></script>
    <script src="../assets/js/plugins/jsvectormap.min.js"></script>
    <script src="../assets/js/plugins/world.js"></script>
    <script src="../assets/js/plugins/world-merc.js"></script>
    <script src="../assets/js/pages/dashboard-sales.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    <script src="../assets/js/plugins/popper.min.js"></script>
    <script src="../assets/js/plugins/simplebar.min.js"></script>
    <script src="../assets/js/plugins/bootstrap.min.js"></script>
    <script src="../assets/js/fonts/custom-font.js"></script>
    <script src="../assets/js/script.js"></script>
    <script src="../assets/js/theme.js"></script>
    <script src="../assets/js/plugins/feather.min.js"></script>

    <script>
        (function() {
            var sidebarToggleBtn = document.getElementById('headerSidebarToggle');

            function updateSidebarToggle() {
                var match = document.body.className.match(/layout-(\w+)/);
                var layout = match ? match[1] : 'default';
                if (sidebarToggleBtn) {
                    sidebarToggleBtn.style.display = (layout === 'sidebar' || layout === 'minimal') ? 'flex' : 'none';
                }
            }

            function setLayout(layout) {
                document.body.className = document.body.className.replace(/layout-\w+/g, '').trim();
                document.body.classList.add('layout-' + layout);
                localStorage.setItem('layout-style', layout);
                document.querySelectorAll('.layout-option').forEach(function(o) {
                    o.classList.toggle('active', o.getAttribute('data-layout') === layout);
                });
                updateSidebarToggle();
            }

            // Create backdrop for mobile sidebar
            var backdrop = document.createElement('div');
            backdrop.className = 'layout-sidebar-backdrop';
            document.body.appendChild(backdrop);

            backdrop.addEventListener('click', function() {
                document.getElementById('layoutSidebar').classList.remove('open');
                backdrop.classList.remove('show');
            });

            document.querySelectorAll('.layout-option').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    setLayout(this.getAttribute('data-layout'));
                    var dropdown = this.closest('.dropdown-menu-custom');
                    if (dropdown) dropdown.classList.remove('show');
                });
            });

            // Header sidebar toggle (show/hide sidebar overlay on mobile)
            if (sidebarToggleBtn) {
                sidebarToggleBtn.addEventListener('click', function() {
                    var sidebar = document.getElementById('layoutSidebar');
                    if (sidebar) {
                        sidebar.classList.toggle('open');
                        backdrop.classList.toggle('show');
                    }
                });
            }

            // Sidebar group toggle (expand/collapse submenu)
            document.querySelectorAll('.sidebar-group-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var submenu = this.nextElementSibling;
                    if (submenu && submenu.classList.contains('sidebar-submenu')) {
                        submenu.classList.toggle('open');
                        this.classList.toggle('active');
                    }
                });
            });

            // Sidebar logout
            function handleLogoutClick(btn) {
                if (!btn) return;
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    Swal.fire({
                        title: 'Apakah Anda yakin?',
                        text: "Anda akan keluar dari sistem.",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Ya, logout!',
                        cancelButtonText: 'Batal'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            $.ajax({
                                url: "{{ route('logout') }}",
                                type: "POST",
                                headers: {
                                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                                },
                                success: function(res) {
                                    Swal.fire({
                                        icon: 'success',
                                        title: 'Berhasil',
                                        text: res.message,
                                        timer: 1500,
                                        showConfirmButton: false
                                    });
                                    setTimeout(function() {
                                        window.location.href = res.redirect;
                                    }, 1500);
                                },
                                error: function() {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Gagal',
                                        text: 'Logout gagal'
                                    });
                                }
                            });
                        }
                    });
                });
            }
            handleLogoutClick(document.getElementById('sidebarLogoutFooter'));
            handleLogoutClick(document.getElementById('btnLogoutTop'));

            // Top bar menu toggle (open sidebar on mobile)
            var topBarToggle = document.getElementById('topBarMenuToggle');
            if (topBarToggle) {
                topBarToggle.addEventListener('click', function() {
                    var sidebar = document.getElementById('layoutSidebar');
                    if (sidebar) {
                        sidebar.classList.toggle('open');
                        backdrop.classList.toggle('show');
                    }
                });
            }

            // Mobile sidebar toggle via header hamburger
            var mobToggle = document.getElementById('mobileMenuToggle');
            if (mobToggle) {
                mobToggle.addEventListener('click', function(e) {
                    var layout = document.body.className.match(/layout-(\w+)/);
                    if (layout && (layout[1] === 'sidebar' || layout[1] === 'minimal')) {
                        e.preventDefault();
                        var sidebar = document.getElementById('layoutSidebar');
                        sidebar.classList.toggle('open');
                        backdrop.classList.toggle('show');
                    }
                });
            }
        })();
    </script>

    @stack('scripts')
</body>

</html>
