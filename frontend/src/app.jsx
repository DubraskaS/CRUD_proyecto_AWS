// frontend/src/App.jsx

import React, { useState, useEffect } from 'react';
import { API_URL } from './config';
import './App.css'; // Vamos a usar un archivo CSS simple

// Componente para una fila de usuario (incluye botones)
const UserRow = ({ user, fetchUsers }) => {
    // ... Lógica para editar y eliminar (ver más abajo)
    const handleDelete = async (id) => {
        if (window.confirm(`¿Estás seguro de eliminar a ${user.nombre}?`)) {
            try {
                const response = await fetch(`${API_URL}/usuarios/${id}`, {
                    method: 'DELETE',
                });
                if (!response.ok) {
                    throw new Error('Error al eliminar');
                }
                alert('Usuario eliminado con éxito');
                fetchUsers(); // Recargar la lista después de eliminar
            } catch (error) {
                console.error('Error:', error);
                alert('No se pudo eliminar el usuario.');
            }
        }
    };

    return (
        <tr>
            <td>{user.id}</td>
            <td>{user.nombre}</td>
            <td>{user.email}</td>
            <td>{user.edad}</td>
            <td>
                <button className="btn btn-edit" onClick={() => alert(`Editar ${user.id}`)}>
                    Editar
                </button>
                <button className="btn btn-delete" onClick={() => handleDelete(user.id)}>
                    Eliminar
                </button>
            </td>
        </tr>
    );
};

// Componente para el Formulario de Creación
const CreateUserForm = ({ fetchUsers }) => {
    const [formData, setFormData] = useState({ nombre: '', email: '', edad: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/usuarios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Error al crear usuario');
            }
            alert('Usuario creado!');
            setFormData({ nombre: '', email: '', edad: '' }); // Limpiar formulario
            fetchUsers(); // Recargar lista
        } catch (error) {
            console.error('Error:', error);
            alert('Hubo un error al crear el usuario.');
        }
    };

    return (
        <div className="section">
            <h3>Crear Nuevo Usuario</h3>
            <form onSubmit={handleSubmit}>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Nombre" required />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Correo" required />
                <input type="number" name="edad" value={formData.edad} onChange={handleChange} placeholder="Edad" />
                <button type="submit" className="btn btn-create">
                    Crear Usuario
                </button>
            </form>
        </div>
    );
};

// Componente principal de la aplicación
function App() {
    const [usuarios, setUsuarios] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Función para obtener los usuarios (incluye búsqueda)
    const fetchUsers = async (query = '') => {
        setLoading(true);
        setError(null);
        try {
            // Si hay un query, se añade a la URL de la API: /api/usuarios?q=query
            const url = query ? `${API_URL}/usuarios?q=${query}` : `${API_URL}/usuarios`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('No se pudo conectar con la API.');
            }
            const data = await response.json();
            setUsuarios(data);
        } catch (err) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Cargar la lista al iniciar o cuando cambia el término de búsqueda
    useEffect(() => {
        // Usamos un pequeño retraso para no saturar la API al escribir rápidamente
        const delayDebounceFn = setTimeout(() => {
            fetchUsers(searchTerm);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]); // Re-ejecutar cuando cambia searchTerm

    return (
        <div className="container">
            <div className="sidebar">
                <h2>CRUD de Usuarios</h2>
                <p className="user-info">Dsolorzano</p>
                <p className="total-users">Total de Usuarios: {usuarios.length}</p>

                <CreateUserForm fetchUsers={() => fetchUsers(searchTerm)} />

                <div className="section">
                    <h3>Buscar Usuario</h3>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="main-content">
                <h2>Lista de Usuarios</h2>
                
                {loading && <p>Cargando usuarios...</p>}
                {error && <p className="error-message">Error: {error}</p>}
                
                {!loading && !error && (
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Correo</th>
                                <th>Edad</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map(user => (
                                // Pasamos fetchUsers para que los botones de acción recarguen la lista
                                <UserRow key={user.id} user={user} fetchUsers={() => fetchUsers(searchTerm)} />
                            ))}
                        </tbody>
                    </table>
                )}
                
                {!loading && usuarios.length === 0 && <p>No se encontraron usuarios.</p>}
            </div>
        </div>
    );
}

export default App;