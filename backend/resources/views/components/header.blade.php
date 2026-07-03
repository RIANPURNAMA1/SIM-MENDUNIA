<header class="app-header">
    <div class="header-inner " style="margin: 0 20px">
        <div class="header-left">
            <a href="/" class="header-logo">
                <img src="{{ asset('assets/images/logo/logo5.png') }}" alt="logo" />
            </a>
            <span class="header-brand-name" style="font-style: italic;">Absensi Mendunia</span>
        </div>

            <nav class="header-nav">
                <a href="/" class="header-link {{ request()->is('/') ? 'active' : '' }}">
                    <i class="ph ph-gauge"></i>
                    <span>Dashboard</span>
                </a>

                <div class="header-dropdown">
                    <a href="#" class="header-link dropdown-trigger">
                        <i class="ph ph-users-three"></i>
                        <span>Karyawan</span>
                        <i class="ph ph-caret-down dropdown-arrow"></i>
                    </a>
                    <div class="dropdown-menu-custom">
                        <a href="/karyawan" class="dropdown-item-custom {{ request()->is('karyawan*') ? 'active' : '' }}"><i class="ph ph-users"></i>Data Karyawan</a>
                        <a href="/divisi" class="dropdown-item-custom {{ request()->is('divisi*') ? 'active' : '' }}"><i class="ph ph-buildings"></i>Divisi</a>
                        <a href="/cabang" class="dropdown-item-custom {{ request()->is('cabang*') ? 'active' : '' }}"><i class="ph ph-map-pin"></i>Cabang / Lokasi</a>
                        <a href="/shift" class="dropdown-item-custom {{ request()->is('shift') ? 'active' : '' }}"><i class="ph ph-timer"></i>Shift Kerja</a>
                        <a href="/jadwal-shift" class="dropdown-item-custom {{ request()->is('jadwal-shift*') ? 'active' : '' }}"><i class="ph ph-calendar-plus"></i>Jadwal Shift</a>
                        <a href="/daftar-user" class="dropdown-item-custom {{ request()->is('daftar-user*') ? 'active' : '' }}"><i class="ph ph-list"></i>Daftar User</a>
                    </div>
                </div>

                <div class="header-dropdown">
                    <a href="#" class="header-link dropdown-trigger">
                        <i class="ph ph-calendar-check"></i>
                        <span>Absensi</span>
                        <i class="ph ph-caret-down dropdown-arrow"></i>
                    </a>
                    <div class="dropdown-menu-custom dropdown-menu-wide">
                        <a href="/data-kehadiran" class="dropdown-item-custom {{ request()->is('data-kehadiran*') ? 'active' : '' }}"><i class="ph ph-clipboard-text"></i>Kehadiran</a>
                        <a href="/data-kehadiran-khusus" class="dropdown-item-custom {{ request()->is('data-kehadiran-khusus*') ? 'active' : '' }}"><i class="ph ph-timer"></i>Kehadiran Khusus</a>
                        <a href="/izin-cuti" class="dropdown-item-custom {{ request()->is('izin-cuti*') ? 'active' : '' }}"><i class="ph ph-file-text"></i>Izin & Cuti</a>
                        <a href="/approval-lembur" class="dropdown-item-custom {{ request()->is('approval-lembur*') ? 'active' : '' }}"><i class="ph ph-clock-countdown"></i>Approval Lembur</a>
                        <a href="/hari-libur" class="dropdown-item-custom {{ request()->is('hari-libur*') ? 'active' : '' }}"><i class="ph ph-file-text"></i>Hari Libur</a>
                        <a href="/rekap-absensi" class="dropdown-item-custom {{ request()->is('rekap-absensi*') ? 'active' : '' }}"><i class="ph ph-chart-bar"></i>Rekap Absensi</a>
                        <a href="/rekap-jadwal-shift" class="dropdown-item-custom {{ request()->is('rekap-jadwal-shift*') ? 'active' : '' }}"><i class="ph ph-calendar-check"></i>Rekap Jadwal Shift</a>
                        <a href="/rekap-kehadiran-sensei" class="dropdown-item-custom {{ request()->is('rekap-kehadiran-sensei*') ? 'active' : '' }}"><i class="ph ph-calendar-check"></i>Rekap Kehadiran Sensei</a>
                        <a href="/monitoring-lokasi" class="dropdown-item-custom {{ request()->is('monitoring-lokasi*') ? 'active' : '' }}"><i class="ph ph-map-pin"></i>Monitoring Lokasi</a>
                        <a href="/data-kehadiran-sensei" class="dropdown-item-custom {{ request()->is('data-kehadiran-sensei*') ? 'active' : '' }}"><i class="ph ph-graduation-cap"></i>Kehadiran Sensei</a>
                        <a href="/kelas-sensei" class="dropdown-item-custom {{ request()->is('kelas-sensei*') ? 'active' : '' }}"><i class="ph ph-book-open"></i>Kelas Sensei</a>
                        <a href="/data-agenda" class="dropdown-item-custom {{ request()->is('data-agenda*') ? 'active' : '' }}"><i class="ph ph-calendar"></i>Data Agenda</a>
                    </div>
                </div>

                @php
                    $userNav = auth()->user();
                    $penilaianDivisiIdsNav = \App\Models\PenilaianSetting::where('penilaian_aktif', true)->pluck('divisi_id')->toArray();
                    $bolehPenilaianNav = in_array($userNav->divisi_id, $penilaianDivisiIdsNav) || $userNav->role !== 'KARYAWAN';
                @endphp

                <a href="/ai-chat" class="header-link {{ request()->is('ai-chat') ? 'active' : '' }}">
                    <i class="ph ph-robot"></i>
                    <span>AI Chat</span>
                </a>

                <div class="header-dropdown">
                    <a href="#" class="header-link dropdown-trigger">
                        <i class="ph ph-student"></i>
                        <span>Siswa</span>
                        <i class="ph ph-caret-down dropdown-arrow"></i>
                    </a>
                    <div class="dropdown-menu-custom">
                        <a href="/siswa" class="dropdown-item-custom {{ request()->is('siswa*') ? 'active' : '' }}"><i class="ph ph-users"></i>Data Siswa</a>
                        <a href="/kelas" class="dropdown-item-custom {{ request()->is('kelas*') ? 'active' : '' }}"><i class="ph ph-book-open"></i>Kelas</a>
                        <a href="/batches" class="dropdown-item-custom {{ request()->is('batches*') ? 'active' : '' }}"><i class="ph ph-stack"></i>Batch</a>
                        <a href="/guru" class="dropdown-item-custom {{ request()->is('guru*') ? 'active' : '' }}"><i class="ph ph-chalkboard-teacher"></i>Data Sensei</a>
                        <a href="/absensi-siswa" class="dropdown-item-custom {{ request()->is('absensi-siswa*') ? 'active' : '' }}"><i class="ph ph-clipboard-text"></i>Absensi Siswa</a>
                        <a href="/rekap-siswa" class="dropdown-item-custom {{ request()->is('rekap-siswa*') ? 'active' : '' }}"><i class="ph ph-chart-bar"></i>Rekap Siswa</a>
                        @if($bolehPenilaianNav)
                        <a href="{{ $userNav->role !== 'KARYAWAN' ? '/penilaian' : '/penilaian-karyawan' }}" class="dropdown-item-custom {{ request()->is('penilaian*') ? 'active' : '' }}"><i class="ph ph-notebook"></i>Penilaian Siswa</a>
                        @if($userNav->role !== 'KARYAWAN')
                        <a href="/pengaturan-penilaian" class="dropdown-item-custom {{ request()->is('pengaturan-penilaian') ? 'active' : '' }}"><i class="ph ph-sliders"></i>Pengaturan Penilaian</a>
                        @endif
                        @endif
                    </div>
                </div>

                <div class="header-dropdown">
                    <a href="#" class="header-link dropdown-trigger">
                        <i class="ph ph-gear"></i>
                        <span>Pengaturan</span>
                        <i class="ph ph-caret-down dropdown-arrow"></i>
                    </a>
                    <div class="dropdown-menu-custom">
                        <a href="/pengaturan" class="dropdown-item-custom {{ request()->is('pengaturan') ? 'active' : '' }}"><i class="ph ph-user-gear"></i>Manajemen Akun</a>
                        <a href="/pengaturan-shift" class="dropdown-item-custom {{ request()->is('pengaturan-shift*') ? 'active' : '' }}"><i class="ph ph-timer"></i>Pengaturan Shift</a>
                        <a href="/pengaturan-wa" class="dropdown-item-custom {{ request()->is('pengaturan-wa') ? 'active' : '' }}"><i class="ph ph-whatsapp-logo"></i>Notifikasi WA</a>
                    </div>
                </div>
            </nav>

        <div class="header-right">
            <!-- SIDEBAR TOGGLE (visible only in sidebar modes) -->
            <button class="layout-toggle-btn" id="headerSidebarToggle" title="Toggle Sidebar" style="display:none;">
                <i class="ph ph-sidebar"></i>
            </button>

            <!-- LAYOUT SWITCHER -->
            <div class="header-dropdown">
                <button class="layout-toggle-btn dropdown-trigger" title="Ganti Tampilan">
                    <i class="ph ph-layout"></i>
                </button>
                <div class="dropdown-menu-custom dropdown-menu-right layout-switcher-dropdown">
                    <button class="layout-option" data-layout="default">
                        <span class="layout-option-icon icon-default">
                            <span class="bar-top"></span>
                            <span class="bar-body"></span>
                        </span>
                        <span>Navbar Default</span>
                    </button>
                    <button class="layout-option active" data-layout="sidebar">
                        <span class="layout-option-icon icon-sidebar">
                            <span class="bar-left"></span>
                            <span class="bar-top"></span>
                            <span class="bar-body" style="left:10px;"></span>
                        </span>
                        <span>Navbar + Sidebar</span>
                    </button>
                    <button class="layout-option" data-layout="minimal">
                        <span class="layout-option-icon icon-minimal">
                            <span class="bar-left"></span>
                            <span class="bar-body" style="left:0;"></span>
                        </span>
                        <span>Sidebar Saja</span>
                    </button>
                </div>
            </div>

            <div class="header-dropdown">
                <a href="#" class="header-icon dropdown-trigger">
                    <i class="ph ph-bell"></i>
                    @php
                        $totalNotif = (isset($notifIzin) ? $notifIzin->count() : 0) + (isset($notifLembur) ? $notifLembur->count() : 0);
                    @endphp
                    @if ($totalNotif > 0)
                        <span class="notif-dot">{{ $totalNotif }}</span>
                    @endif
                </a>
                <div class="dropdown-menu-custom dropdown-menu-right dropdown-menu-notif">
                    <div class="dropdown-header-custom">Notifikasi Pengajuan</div>
                    <div class="dropdown-body-custom">
                        @if ((isset($notifIzin) && $notifIzin->count() > 0) || (isset($notifLembur) && $notifLembur->count() > 0))
                            @isset($notifIzin)
                                @foreach ($notifIzin as $item)
                                    <a href="{{ url('/izin-cuti') }}" class="dropdown-item-custom">
                                        <i class="ph ph-envelope-simple {{ $item->jenis_izin == 'SAKIT' ? 'text-danger' : 'text-primary' }}"></i>
                                        <div>
                                            <p><strong>{{ $item->user->name }}</strong>: {{ $item->jenis_izin }}</p>
                                            <small>{{ $item->created_at->diffForHumans() }}</small>
                                        </div>
                                    </a>
                                @endforeach
                            @endisset
                            @isset($notifLembur)
                                @foreach ($notifLembur as $lembur)
                                    <a href="{{ url('/approval-lembur') }}" class="dropdown-item-custom">
                                        <i class="ph ph-timer text-success"></i>
                                        <div>
                                            <p><strong>{{ $lembur->user->name }}</strong>: LEMBUR</p>
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
                        <a href="{{ url('/izin-cuti') }}">Semua Izin</a>
                        <span>|</span>
                        <a href="{{ url('/approval-lembur') }}">Semua Lembur</a>
                    </div>
                </div>
            </div>

            <div class="header-dropdown">
                <a href="#" class="header-profile dropdown-trigger">
                    <img src="{{ Auth::user()->foto_profil ? asset('uploads/profil/' . Auth::user()->foto_profil) : asset('assets/images/user/avatar-2.jpg') }}" alt="avatar" class="header-profile-avatar" />
                    <div class="header-profile-info">
                        <span class="header-profile-name">{{ Auth::user()->name }}</span>
                        <span class="header-profile-role">{{ Auth::user()->role }}</span>
                    </div>
                    <i class="ph ph-caret-down header-profile-arrow"></i>
                </a>
                <div class="dropdown-menu-custom dropdown-menu-right dropdown-menu-profile">
                    <a href="/pengaturan" class="dropdown-item-custom"><i class="ph ph-user-gear"></i>Manajemen Akun</a>
                    <div class="dropdown-divider-custom"></div>
                    <a href="#" class="dropdown-item-custom text-danger" id="btnLogout"><i class="ph ph-sign-out"></i>Logout</a>
                </div>
            </div>

            <button class="mobile-toggle" id="mobileMenuToggle">
                <i class="ph ph-list"></i>
            </button>
        </div>
    </div>

    <div class="mobile-menu" id="mobileMenu">
        <div class="mobile-menu-header">
            <span class="mobile-menu-title">Menu</span>
            <button class="mobile-menu-close" id="mobileMenuClose"><i class="ph ph-x"></i></button>
        </div>
        <a href="/" class="mobile-link {{ request()->is('/') ? 'active' : '' }}">
            <i class="ph ph-gauge"></i>Dashboard
        </a>

        <div class="mobile-dropdown">
            <a href="#" class="mobile-link mob-dropdown-trigger">
                <i class="ph ph-users-three"></i>Karyawan <i class="ph ph-caret-down ms-auto"></i>
            </a>
            <div class="mobile-submenu">
                <a href="/karyawan" class="mobile-sub-link {{ request()->is('karyawan*') ? 'active' : '' }}">Data Karyawan</a>
                <a href="/divisi" class="mobile-sub-link {{ request()->is('divisi*') ? 'active' : '' }}">Divisi</a>
                <a href="/cabang" class="mobile-sub-link {{ request()->is('cabang*') ? 'active' : '' }}">Cabang / Lokasi</a>
                <a href="/shift" class="mobile-sub-link {{ request()->is('shift') ? 'active' : '' }}">Shift Kerja</a>
                <a href="/jadwal-shift" class="mobile-sub-link {{ request()->is('jadwal-shift*') ? 'active' : '' }}">Jadwal Shift</a>
                <a href="/daftar-user" class="mobile-sub-link {{ request()->is('daftar-user*') ? 'active' : '' }}">Daftar User</a>
            </div>
        </div>

        <div class="mobile-dropdown">
            <a href="#" class="mobile-link mob-dropdown-trigger">
                <i class="ph ph-calendar-check"></i>Absensi <i class="ph ph-caret-down ms-auto"></i>
            </a>
            <div class="mobile-submenu">
                <a href="/data-kehadiran" class="mobile-sub-link {{ request()->is('data-kehadiran*') ? 'active' : '' }}">Kehadiran</a>
                <a href="/data-kehadiran-khusus" class="mobile-sub-link {{ request()->is('data-kehadiran-khusus*') ? 'active' : '' }}">Kehadiran Khusus</a>
                <a href="/izin-cuti" class="mobile-sub-link {{ request()->is('izin-cuti*') ? 'active' : '' }}">Izin & Cuti</a>
                <a href="/approval-lembur" class="mobile-sub-link {{ request()->is('approval-lembur*') ? 'active' : '' }}">Approval Lembur</a>
                <a href="/hari-libur" class="mobile-sub-link {{ request()->is('hari-libur*') ? 'active' : '' }}">Hari Libur</a>
                 <a href="/rekap-absensi" class="mobile-sub-link {{ request()->is('rekap-absensi*') ? 'active' : '' }}">Rekap Absensi</a>
                 <a href="/rekap-jadwal-shift" class="mobile-sub-link {{ request()->is('rekap-jadwal-shift*') ? 'active' : '' }}">Rekap Jadwal Shift</a>
                 <a href="/rekap-kehadiran-sensei" class="mobile-sub-link {{ request()->is('rekap-kehadiran-sensei*') ? 'active' : '' }}">Rekap Kehadiran Sensei</a>
                <a href="/monitoring-lokasi" class="mobile-sub-link {{ request()->is('monitoring-lokasi*') ? 'active' : '' }}">Monitoring Lokasi</a>
                <a href="/data-kehadiran-sensei" class="mobile-sub-link {{ request()->is('data-kehadiran-sensei*') ? 'active' : '' }}">Kehadiran Sensei</a>
                <a href="/kelas-sensei" class="mobile-sub-link {{ request()->is('kelas-sensei*') ? 'active' : '' }}">Kelas Sensei</a>
                <a href="/data-agenda" class="mobile-sub-link {{ request()->is('data-agenda*') ? 'active' : '' }}">Data Agenda</a>
            </div>
        </div>

        <div class="mobile-dropdown">
            <a href="#" class="mobile-link mob-dropdown-trigger">
                <i class="ph ph-student"></i>Siswa <i class="ph ph-caret-down ms-auto"></i>
            </a>
            <div class="mobile-submenu">
                <a href="/siswa" class="mobile-sub-link {{ request()->is('siswa*') ? 'active' : '' }}">Data Siswa</a>
                <a href="/kelas" class="mobile-sub-link {{ request()->is('kelas*') ? 'active' : '' }}">Kelas</a>
                <a href="/batches" class="mobile-sub-link {{ request()->is('batches*') ? 'active' : '' }}">Batch</a>
                <a href="/guru" class="mobile-sub-link {{ request()->is('guru*') ? 'active' : '' }}">Data Sensei</a>
                <a href="/absensi-siswa" class="mobile-sub-link {{ request()->is('absensi-siswa*') ? 'active' : '' }}">Absensi Siswa</a>
                <a href="/rekap-siswa" class="mobile-sub-link {{ request()->is('rekap-siswa*') ? 'active' : '' }}">Rekap Siswa</a>
                @if($bolehPenilaianNav)
                <a href="{{ $userNav->role !== 'KARYAWAN' ? '/penilaian' : '/penilaian-karyawan' }}" class="mobile-sub-link {{ request()->is('penilaian*') ? 'active' : '' }}">Penilaian Siswa</a>
                @if($userNav->role !== 'KARYAWAN')
                <a href="/pengaturan-penilaian" class="mobile-sub-link {{ request()->is('pengaturan-penilaian') ? 'active' : '' }}">Pengaturan Penilaian</a>
                @endif
                @endif
            </div>
        </div>

        <a href="/ai-chat" class="mobile-link {{ request()->is('ai-chat*') ? 'active' : '' }}">
            <i class="ph ph-robot"></i>AI Chat
        </a>

        <a href="/pengaturan-shift" class="mobile-link {{ request()->is('pengaturan-shift*') ? 'active' : '' }}">
            <i class="ph ph-timer"></i>Pengaturan Shift
        </a>
        <a href="/pengaturan-wa" class="mobile-link {{ request()->is('pengaturan-wa*') ? 'active' : '' }}">
            <i class="ph ph-gear"></i>Notifikasi WA
        </a>

        <div class="mobile-divider"></div>

        <a href="/pengaturan" class="mobile-link">
            <i class="ph ph-user-gear"></i>Manajemen Akun
        </a>
        <a href="#" class="mobile-link text-danger" id="btnLogoutMobile">
            <i class="ph ph-sign-out"></i>Logout
        </a>
    </div>
</header>

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<script>
    $(document).ready(function() {
        // Dropdown toggle
        $(document).on('click', '.dropdown-trigger', function(e) {
            e.preventDefault();
            var menu = $(this).siblings('.dropdown-menu-custom');
            $('.dropdown-menu-custom').not(menu).removeClass('show');
            menu.toggleClass('show');
        });

        $(document).on('click', function(e) {
            if (!$(e.target).closest('.header-dropdown').length) {
                $('.dropdown-menu-custom').removeClass('show');
            }
        });

        // Mobile menu toggle
        $('#mobileMenuToggle, #mobileMenuClose').on('click', function() {
            $('#mobileMenu').toggleClass('show');
        });

        // Close mobile menu on backdrop click
        $(document).on('click', function(e) {
            if ($('#mobileMenu').hasClass('show')) {
                if (!$(e.target).closest('#mobileMenu, #mobileMenuToggle').length) {
                    $('#mobileMenu').removeClass('show');
                }
            }
        });

        // Mobile submenu toggle
        $(document).on('click', '.mob-dropdown-trigger', function(e) {
            e.preventDefault();
            $(this).siblings('.mobile-submenu').slideToggle(200);
            $(this).find('.ph-caret-down').toggleClass('rotated');
        });

        // Logout
        function handleLogout(btn) {
            $(btn).on('click', function(e) {
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
                                setTimeout(() => {
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

        handleLogout('#btnLogout');
        handleLogout('#btnLogoutMobile');
    });
</script>
