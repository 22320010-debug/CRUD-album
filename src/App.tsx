// src/App.tsx
import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

export interface Album {
  userId: number;
  id: number;
  title: string;
}

const API_URL = 'https://jsonplaceholder.typicode.com/albums';
const ITEMS_PER_PAGE = 5;

const App: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [userIdInput, setUserIdInput] = useState<string>('');
  const [titleInput, setTitleInput] = useState<string>('');

  // Edit Mode State
  const [editingId, setEditingId] = useState<number | null>(null);

  // Search & Pagination State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 1. READ (GET) - Mengambil Data Album
  const fetchAlbums = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Gagal mengambil data dari server.');
      const data: Album[] = await response.json();
      setAlbums(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan yang tidak diketahui.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  // PERBAIKAN: Fungsi Refresh Lengkap
  const handleRefresh = () => {
    resetForm();
    setSearchTerm('');
    setCurrentPage(1);
    fetchAlbums();
  };

  // Filter & Pagination Logic
  const filteredAlbums = useMemo(() => {
    return albums.filter((album) =>
      album.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [albums, searchTerm]);

  const totalPages = Math.ceil(filteredAlbums.length / ITEMS_PER_PAGE) || 1;

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return filteredAlbums.slice(firstPageIndex, lastPageIndex);
  }, [filteredAlbums, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 2. CREATE (POST) - Menambah Album
  const handleAddAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !userIdInput) return;

    const newAlbum: Album = {
      id: albums.length > 0 ? Math.max(...albums.map((a) => a.id)) + 1 : 1,
      title: titleInput,
      userId: Number(userIdInput),
    };

    // Update state lokal langsung
    setAlbums([newAlbum, ...albums]);
    resetForm();

    // Kirim request ke backend JSONPlaceholder
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleInput,
          userId: Number(userIdInput),
        }),
      });
    } catch (err: unknown) {
      console.error('API POST Error:', err);
    }
  };

  // 3. UPDATE (PUT) - Memperbarui Album (PERBAIKAN)
  const startEdit = (album: Album) => {
    setEditingId(album.id);
    setUserIdInput(album.userId.toString());
    setTitleInput(album.title);
    // Scroll otomatis ke form bagian atas
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateAlbum = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingId || !titleInput.trim() || !userIdInput) return;

    // Perbarui data di state lokal secara instan
    setAlbums((prevAlbums) =>
      prevAlbums.map((item) =>
        item.id === editingId
          ? { ...item, title: titleInput, userId: Number(userIdInput) }
          : item
      )
    );

    const targetId = editingId;
    resetForm();

    // Kirim request PUT ke server jika ID asli (1-100)
    try {
      if (targetId <= 100) {
        await fetch(`${API_URL}/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: targetId,
            title: titleInput,
            userId: Number(userIdInput),
          }),
        });
      }
    } catch (err: unknown) {
      console.error('API PUT Error:', err);
    }
  };

  // 4. DELETE (DELETE) - Menghapus Langsung
  const handleDeleteAlbum = async (id: number) => {
    // Hapus dari tampilan seketika
    setAlbums((prevAlbums) => prevAlbums.filter((item) => item.id !== id));

    try {
      if (id <= 100) {
        await fetch(`${API_URL}/${id}`, {
          method: 'DELETE',
        });
      }
    } catch (err: unknown) {
      console.error('API DELETE Error:', err);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setUserIdInput('');
    setTitleInput('');
  };

  return (
    <div className="pink-theme-app">
      <div className="main-wrapper">
        
        {/* HEADER BANNER */}
        <header className="header-card">
          <div className="header-left">
            <div className="header-icon-box">
              <svg className="icon-main" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="4" ry="4" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <div className="badge-music">♫</div>
            </div>
            <div className="header-text">
              <h1>Album Manager</h1>
            </div>
          </div>
          <div className="header-right">
            <span className="script-text">Small albums<br />big memories ♥</span>
          </div>
        </header>

        {/* FORM TAMBAH / EDIT */}
        <section className="pink-card">
          <div className="card-header-title">
            <div className="pink-circle-icon">{editingId ? '✏️' : '+'}</div>
            <h2>{editingId ? 'Edit Album' : 'Tambah Album'}</h2>
          </div>

          <form onSubmit={editingId ? handleUpdateAlbum : handleAddAlbum}>
            <div className="form-grid">
              <div className="input-group">
                <label>User ID</label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    type="number"
                    placeholder="Masukkan user ID"
                    value={userIdInput}
                    onChange={(e) => setUserIdInput(e.target.value)}
                    min={1}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Judul Album</label>
                <div className="input-wrapper">
                  <span className="input-icon">🖼️</span>
                  <input
                    type="text"
                    placeholder="Masukkan judul album"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="button-group">
              {!editingId ? (
                <button type="submit" className="btn btn-pink-primary">
                  <span>+</span> Tambah Album
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-pink-primary"
                    onClick={handleUpdateAlbum}
                  >
                    💾 Simpan Perubahan
                  </button>

                  <button
                    type="button"
                    className="btn btn-pink-soft"
                    onClick={resetForm}
                  >
                    ✕ Batal
                  </button>
                </>
              )}
            </div>
          </form>
        </section>

        {/* TABEL DAFTAR ALBUM */}
        <section className="pink-card">
          <div className="table-top-bar">
            <div className="card-header-title">
              <div className="pink-circle-icon">≡</div>
              <h2>Daftar Album</h2>
            </div>

            <div className="table-actions">
              <div className="search-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Cari judul album..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button className="btn btn-pink-outline" onClick={handleRefresh} title="Refresh Data">
                🔄 Refresh
              </button>
            </div>
          </div>

          {loading && <div className="state-message">Sedang memuat data... 🌸</div>}
          {error && <div className="state-message error-text">⚠️ {error}</div>}

          {!loading && !error && (
            <>
              <div className="table-responsive">
                <table className="pink-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>ID</th>
                      <th style={{ width: '100px' }}>User ID</th>
                      <th>Judul Album</th>
                      <th style={{ width: '180px', textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTableData.length > 0 ? (
                      currentTableData.map((album) => (
                        <tr key={album.id} className={editingId === album.id ? 'row-editing' : ''}>
                          <td>{album.id}</td>
                          <td>{album.userId}</td>
                          <td className="album-title-cell">{album.title}</td>
                          <td>
                            <div className="action-buttons-cell">
                              <button
                                className="btn-action btn-edit"
                                onClick={() => startEdit(album)}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                className="btn-action btn-delete"
                                onClick={() => handleDeleteAlbum(album.id)}
                              >
                                🗑️ Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>
                          Tidak ada data album yang ditemukan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <div className="total-count">
                  🖼️ Total album: <strong>{filteredAlbums.length}</strong>
                </div>

                <div className="pagination">
                  <button
                    className="page-nav"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  >
                    ‹
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                    let pageNum = index + 1;
                    if (currentPage > 3 && totalPages > 5) {
                      pageNum = currentPage - 2 + index;
                      if (pageNum > totalPages) pageNum = totalPages - (4 - index);
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`page-num ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    className="page-nav"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  >
                    ›
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

      </div>
    </div>
  );
};

export default App;