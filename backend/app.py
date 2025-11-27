from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os # Para manejar variables de entorno

# --- Configuración de la Aplicación ---
app = Flask(__name__)
CORS(app) # Habilita CORS para el frontend de Vercel

# ⚠️ Importante: Usa una variable de entorno para la URL de RDS
# Esto es más seguro y requerido en producción.
# Ejemplo en Linux/macOS: export DATABASE_URL='postgresql://user:pass@host:port/dbname'
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///dev.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- 1. Modelo del Usuario (Entidad en la Base de Datos) ---
class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    # ¡NUEVO CAMPO!
    edad = db.Column(db.Integer, nullable=True) 
    rol = db.Column(db.String(50), default='cliente')

    def to_json(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'edad': self.edad, # ¡Incluido!
            'rol': self.rol
        }

# --- 2. Endpoint Agregar Usuario (C: Create) ---
@app.route('/api/usuarios', methods=['POST'])
def agregar_usuario():
    data = request.get_json()
    if not data or 'nombre' not in data or 'email' not in data:
        return jsonify({"error": "Faltan datos requeridos (nombre, email)"}), 400
    
    try:
        nuevo_usuario = Usuario(
            nombre=data['nombre'],
            email=data['email'],
            edad=data.get('edad'), # Incluir edad
            rol=data.get('rol', 'cliente')
        )
        db.session.add(nuevo_usuario)
        db.session.commit()
        return jsonify({"mensaje": "Usuario agregado", "usuario": nuevo_usuario.to_json()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al crear usuario: {str(e)}"}), 500

## 🔍 Buscar Usuarios (R: Read - Todos y Búsqueda)
@app.route('/api/usuarios', methods=['GET'])
def buscar_usuarios():
    query = request.args.get('q') # Obtener el parámetro 'q' para búsqueda
    
    if query:
        # Buscar por nombre o email que contenga la cadena
        usuarios = Usuario.query.filter(
            (Usuario.nombre.ilike(f'%{query}%')) | 
            (Usuario.email.ilike(f'%{query}%'))
        ).all()
    else:
        # Obtener todos si no hay parámetro de búsqueda
        usuarios = Usuario.query.all()
    
    lista_usuarios = [u.to_json() for u in usuarios]
    return jsonify(lista_usuarios)

## 🔄 Modificar Usuario (U: Update)
@app.route('/api/usuarios/<int:id>', methods=['PUT'])
def modificar_usuario(id):
    usuario = Usuario.query.get(id)
    if usuario is None:
        return jsonify({"error": "Usuario no encontrado"}), 404

    data = request.get_json()
    
    # Actualizar solo los campos proporcionados
    usuario.nombre = data.get('nombre', usuario.nombre)
    usuario.email = data.get('email', usuario.email)
    usuario.rol = data.get('rol', usuario.rol)
    
    try:
        db.session.commit()
        return jsonify({"mensaje": "Usuario modificado", "usuario": usuario.to_json()})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al modificar usuario: {str(e)}"}), 500

## ❌ Eliminar Usuario (D: Delete)
@app.route('/api/usuarios/<int:id>', methods=['DELETE'])
def eliminar_usuario(id):
    usuario = Usuario.query.get(id)
    if usuario is None:
        return jsonify({"error": "Usuario no encontrado"}), 404

    try:
        db.session.delete(usuario)
        db.session.commit()
        return jsonify({"mensaje": "Usuario eliminado"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al eliminar usuario: {str(e)}"}), 500

# --- Ejecución ---
if __name__ == '__main__':
    # Nota: Nunca uses debug=True en producción (deployment en Vercel).
    app.run(debug=True)