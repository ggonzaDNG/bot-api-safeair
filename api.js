const fs = require('fs');

const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.get('/leermediciones', (req, res) => {
    const datos = fs.readFileSync('mediciones.json', 'utf-8');
    let jsonData = JSON.parse(datos);
    res.status(200).json(jsonData);
});

app.post ('/mediciones', (req, res) => {
    try {
        const datos = fs.readFileSync('mediciones.json', 'utf-8');
        let jsonData = JSON.parse();

        Object.keys(req.body).forEach((key) => {
            if (jsonData.hasOwnProperty(key)) {
                jsonData[key] = req.body[key]
            }
        });

        fs.writeFileSync('mediciones.json', JSON.stringify(jsonData, null, 2));

        res.status(200).json({ mensaje: "Mediciones recibidas y actualizadas correctamente."});
    } catch (error) {
        console.error('Error al actualizar las mediciones: ', err);
        res.status(500).json({ error: "Error al actualizar las mediciones, chequear la consola."});    
    }
    
});

app.listen(port, () => {
    console.log('Corriendo en: ', port);
})