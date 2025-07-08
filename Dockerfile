# Usa una imagen base de Python
FROM python:3.9-slim

# Establece el directorio de trabajo
WORKDIR /app

# Copia todo el contenido del proyecto en el contenedor
COPY . .

# Instala las dependencias desde requirements.txt
RUN pip install --no-cache-dir -r req.txt

# Expone el puerto 5000 para Flask
EXPOSE 5000

# Inicia la aplicación Flask
CMD ["python", "main.py"]
