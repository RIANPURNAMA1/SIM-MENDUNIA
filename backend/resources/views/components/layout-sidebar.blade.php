<div class="layout-sidebar" id="layoutSidebar">
    <div class="sidebar-header">
        <img src="{{ asset('assets/images/logo/logo5.png') }}" alt="logo" />
        <span>Absensi Mendunia</span>
    </div>
    <div class="sidebar-body">
        <a href="/" class="sidebar-link {{ request()->is('/') ? 'active' : '' }}">
            <i class="ph ph-gauge"></i> Dashboard
        </a>

        <div class="sidebar-divider"></div>

        <div class="sidebar-group">
            <button
                class="sidebar-group-btn {{ request()->is('karyawan*') || request()->is('divisi*') || request()->is('cabang*') || request()->is('shift*') || request()->is('daftar-user*') || request()->is('jadwal-shift*') ? 'active' : '' }}">
                <i class="ph ph-users-three"></i>
                <span>Karyawan</span>
                <i class="ph ph-caret-down sidebar-group-arrow"></i>
            </button>
            <div
                class="sidebar-submenu {{ request()->is('karyawan*') || request()->is('divisi*') || request()->is('cabang*') || request()->is('shift*') || request()->is('daftar-user*') || request()->is('jadwal-shift*') ? 'open' : '' }}">
                <a href="/karyawan" class="sidebar-sub-link {{ request()->is('karyawan*') ? 'active' : '' }}"><i
                        class="ph ph-users"></i> Data Karyawan</a>
                <a href="/divisi" class="sidebar-sub-link {{ request()->is('divisi*') ? 'active' : '' }}"><i
                        class="ph ph-buildings"></i> Divisi</a>
                <a href="/cabang" class="sidebar-sub-link {{ request()->is('cabang*') ? 'active' : '' }}"><i
                        class="ph ph-map-pin"></i> Cabang / Lokasi</a>
                <a href="/shift" class="sidebar-sub-link {{ request()->is('shift*') ? 'active' : '' }}"><i
                        class="ph ph-timer"></i> Shift Kerja</a>
                <a href="/jadwal-shift" class="sidebar-sub-link {{ request()->is('jadwal-shift*') ? 'active' : '' }}"><i
                        class="ph ph-calendar-plus"></i> Jadwal Shift</a>
                <a href="/daftar-user" class="sidebar-sub-link {{ request()->is('daftar-user*') ? 'active' : '' }}"><i
                        class="ph ph-list"></i> Daftar User</a>
            </div>
        </div>
        <a href="/guru" class="sidebar-link {{ request()->is('guru*') ? 'active' : '' }}">
            <i class="ph ph-chalkboard-teacher"></i> Sensei / Guru
        </a>

        <div class="sidebar-group">
            <button
                class="sidebar-group-btn {{ request()->is('data-kehadiran*') || request()->is('izin-cuti*') || request()->is('approval-lembur*') || request()->is('hari-libur*') || request()->is('rekap-absensi*') || request()->is('rekap-jadwal-shift*') || request()->is('monitoring-lokasi*') || request()->is('data-agenda*') || request()->is('data-kehadiran-khusus*') ? 'active' : '' }}">
                <i class="ph ph-calendar-check"></i>
                <span>Absensi</span>
                <i class="ph ph-caret-down sidebar-group-arrow"></i>
            </button>
            <div
                class="sidebar-submenu {{ request()->is('data-kehadiran*') || request()->is('izin-cuti*') || request()->is('approval-lembur*') || request()->is('hari-libur*') || request()->is('rekap-absensi*') || request()->is('rekap-jadwal-shift*') || request()->is('monitoring-lokasi*') || request()->is('data-agenda*') || request()->is('data-kehadiran-khusus*') ? 'open' : '' }}">
                <a href="/data-kehadiran"
                    class="sidebar-sub-link {{ request()->is('data-kehadiran*') ? 'active' : '' }}"><i
                        class="ph ph-clipboard-text"></i> Kehadiran</a>
                <a href="/data-kehadiran-khusus"
                    class="sidebar-sub-link {{ request()->is('data-kehadiran-khusus*') ? 'active' : '' }}"><i
                        class="ph ph-timer"></i> Kehadiran Khusus</a>
                <a href="/izin-cuti" class="sidebar-sub-link {{ request()->is('izin-cuti*') ? 'active' : '' }}"><i
                        class="ph ph-file-text"></i> Izin & Cuti</a>
                <a href="/approval-lembur"
                    class="sidebar-sub-link {{ request()->is('approval-lembur*') ? 'active' : '' }}"><i
                        class="ph ph-clock-countdown"></i> Approval Lembur</a>
                <a href="/hari-libur" class="sidebar-sub-link {{ request()->is('hari-libur*') ? 'active' : '' }}"><i
                        class="ph ph-file-text"></i> Hari Libur</a>
                <a href="/rekap-absensi"
                    class="sidebar-sub-link {{ request()->is('rekap-absensi*') ? 'active' : '' }}"><i
                        class="ph ph-chart-bar"></i> Rekap Absensi</a>
                <a href="/rekap-jadwal-shift"
                    class="sidebar-sub-link {{ request()->is('rekap-jadwal-shift*') ? 'active' : '' }}"><i
                        class="ph ph-calendar-check"></i> Rekap Jadwal Shift</a>
                <a href="/monitoring-lokasi"
                    class="sidebar-sub-link {{ request()->is('monitoring-lokasi*') ? 'active' : '' }}"><i
                        class="ph ph-map-pin"></i> Monitoring Lokasi</a>
                <a href="/data-agenda" class="sidebar-sub-link {{ request()->is('data-agenda*') ? 'active' : '' }}"><i
                        class="ph ph-calendar"></i> Data Agenda</a>
            </div>
        </div>

        <div class="sidebar-group">
            <button
                class="sidebar-group-btn {{ request()->is('rekap-kehadiran-sensei*') || request()->is('data-kehadiran-sensei*') || request()->is('kelas-sensei*') || request()->is('jadwal-level*') ? 'active' : '' }}">
                <i class="ph ph-graduation-cap"></i>
                <span>Absensi Sensei</span>
                <i class="ph ph-caret-down sidebar-group-arrow"></i>
            </button>
            <div
                class="sidebar-submenu {{ request()->is('rekap-kehadiran-sensei*') || request()->is('data-kehadiran-sensei*') || request()->is('kelas-sensei*') || request()->is('jadwal-level*') ? 'open' : '' }}">
                <a href="/rekap-kehadiran-sensei"
                    class="sidebar-sub-link {{ request()->is('rekap-kehadiran-sensei*') ? 'active' : '' }}"><i
                        class="ph ph-chart-bar"></i> Rekap Kehadiran Sensei</a>
                <a href="/data-kehadiran-sensei"
                    class="sidebar-sub-link {{ request()->is('data-kehadiran-sensei*') ? 'active' : '' }}"><i
                        class="ph ph-clipboard-text"></i> Kehadiran Sensei</a>
                <a href="/kelas-sensei"
                    class="sidebar-sub-link {{ request()->is('kelas-sensei*') ? 'active' : '' }}"><i
                        class="ph ph-book-open"></i> Kelas Sensei</a>
                <a href="/jadwal-level"
                    class="sidebar-sub-link {{ request()->is('jadwal-level*') ? 'active' : '' }}"><i
                        class="ph ph-calendar"></i> Jadwal Level</a>
            </div>
        </div>


        @php
            $userNavSide = auth()->user();
            $penilaianDivisiIdsSide = \App\Models\PenilaianSetting::where('penilaian_aktif', true)
                ->pluck('divisi_id')
                ->toArray();
            $bolehPenilaianSide =
                in_array($userNavSide->divisi_id, $penilaianDivisiIdsSide) || $userNavSide->role !== 'KARYAWAN';
        @endphp

        <div class="sidebar-group">
            <button
                class="sidebar-group-btn {{ request()->is('siswa*') || request()->is('kelas*') || request()->is('batches*') || request()->is('absensi-siswa*') || request()->is('rekap-siswa*') || request()->is('penilaian*') ? 'active' : '' }}">
                <i class="ph ph-student"></i>
                <span>Siswa</span>
                <i class="ph ph-caret-down sidebar-group-arrow"></i>
            </button>
            <div
                class="sidebar-submenu {{ request()->is('siswa*') || request()->is('kelas*') || request()->is('batches*') || request()->is('absensi-siswa*') || request()->is('rekap-siswa*') || request()->is('penilaian*') ? 'open' : '' }}">
                <a href="/siswa" class="sidebar-sub-link {{ request()->is('siswa*') ? 'active' : '' }}"><i
                        class="ph ph-users"></i> Data Siswa</a>
                <a href="/kelas" class="sidebar-sub-link {{ request()->is('kelas*') ? 'active' : '' }}"><i
                        class="ph ph-book-open"></i> Kelas</a>
                <a href="/batches" class="sidebar-sub-link {{ request()->is('batches*') ? 'active' : '' }}"><i
                        class="ph ph-stack"></i> Batch</a>
                <a href="/absensi-siswa"
                    class="sidebar-sub-link {{ request()->is('absensi-siswa*') ? 'active' : '' }}"><i
                        class="ph ph-clipboard-text"></i> Absensi Siswa</a>
                <a href="/rekap-siswa" class="sidebar-sub-link {{ request()->is('rekap-siswa*') ? 'active' : '' }}"><i
                        class="ph ph-chart-bar"></i> Rekap Siswa</a>
                @if ($bolehPenilaianSide)
                    <a href="{{ $userNavSide->role !== 'KARYAWAN' ? '/penilaian' : '/penilaian-karyawan' }}"
                        class="sidebar-sub-link {{ request()->is('penilaian*') ? 'active' : '' }}"><i
                            class="ph ph-notebook"></i> Penilaian Siswa</a>
                    @if ($userNavSide->role !== 'KARYAWAN')
                        <a href="/pengaturan-penilaian"
                            class="sidebar-sub-link {{ request()->is('pengaturan-penilaian') ? 'active' : '' }}"><i
                                class="ph ph-sliders"></i> Pengaturan Penilaian</a>
                    @endif
                @endif
            </div>
        </div>

        @php
            $roleUserSide = auth()->user()->role;
        @endphp
        <a href="/ai-chat" class="sidebar-link {{ request()->is('ai-chat') ? 'active' : '' }}">
            <i class="ph ph-robot"></i> AI Chat
        </a>
        <div class="sidebar-group">
            <button class="sidebar-group-btn {{ request()->is('pengaturan*') ? 'active' : '' }}">
                <i class="ph ph-gear"></i>
                <span>Pengaturan</span>
                <i class="ph ph-caret-down sidebar-group-arrow"></i>
            </button>
            <div class="sidebar-submenu {{ request()->is('pengaturan*') ? 'open' : '' }}">
                <a href="/pengaturan" class="sidebar-sub-link {{ request()->is('pengaturan') ? 'active' : '' }}"><i
                        class="ph ph-user-gear"></i> Manajemen Akun</a>
                <a href="/pengaturan-shift"
                    class="sidebar-sub-link {{ request()->is('pengaturan-shift*') ? 'active' : '' }}"><i
                        class="ph ph-timer"></i> Pengaturan Shift</a>
                <a href="/pengaturan-wa"
                    class="sidebar-sub-link {{ request()->is('pengaturan-wa') ? 'active' : '' }}"><i
                        class="ph ph-whatsapp-logo"></i> Notifikasi WA</a>
            </div>
        </div>

    </div>
    <div class="sidebar-footer">
        <button class="sidebar-layout-toggle" id="sidebarLogoutFooter">
            <i class="ph ph-sign-out"></i>
            <span>Logout</span>
        </button>
    </div>
</div>
