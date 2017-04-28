'use strict'

// Cargamos Path y FS para manejar ficheros
var path = require('path');
var fs = require('fs');

// Cargamos los modelos Artist, Album y Songs
var Artist = require('../models/artist');
var Album = require('../models/album');
var Song = require('../models/song');

// Función para obtener un album: Requiere ID
function getAlbum(req, res){
	var albumId = req.params.id;

	Album.findById(albumId).populate({path: 'artist'}).exec((err, album)=>{
		if(err){
			res.status(500).send({message: 'Error en la petición'});
		}else{
			if(!album){
				res.status(404).send({message: 'El album no existe.'});
			}else{
				res.status(200).send({album});
			}
		}
	});
}

// Función para obtener varios albums: Si se define el ID del artista devuelve sus albums, sino devuele todos
function getAlbums(req, res){
	var artistId = req.params.artist;
	if(!artistId){
		// Sacar todos los albums de la bbdd
		var find = Album.find({}).sort('title');
	}else{
		// Sacar los albums de un artista concreto de la bbdd
		var find = Album.find({artist: artistId}).sort('year');
	}

	// La función Populate obtiene el objeto a partir del ID y nos proporciona todos sus datos
	find.populate({path: 'artist'}).exec((err, albums) => {
		if(err){
			res.status(500).send({message: 'Error en la petición'});
		}else{
			if(!albums){
				res.status(404).send({message: 'No hay albums'});
			}else{
				res.status(200).send({albums});
			}
		}
	});
}

// Función para guardar un Album: Se debe pasar por el cuerpo de la peticion los datos del album
function saveAlbum(req, res){
	var album = new Album();

	var params = req.body;
	album.title = params.title;
	album.description = params.description;
	album.year = params.year;
	album.image = 'null';
	album.artist = params.artist;

	album.save((err, albumStored) => {
		if(err){
			res.status(500).send({message: 'Error en el servidor'});
		}else{
			if(!albumStored){
				res.status(404).send({message: 'No se ha guardado el album'});
			}else{
				res.status(200).send({album: albumStored});
			}
		}
	});
}

// Función para actualizar un album: Se deben pasar los datos del album por el cuerpo de la peticion y por parametro el ID del album
function updateAlbum(req, res){
	var albumId = req.params.id;
	var update = req.body;

	Album.findByIdAndUpdate(albumId, update, (err, albumUpdated) => {
		if(err){
			res.status(500).send({message: 'Error en el servidor'});
		}else{
			if(!albumUpdated){
				res.status(404).send({message: 'No se ha actualizado el album'});
			}else{
				res.status(200).send({album: albumUpdated});
			}
		}
	});
}

// Función para borrar un album: Se debe especificar el ID del Album (Si se elimina un album tambien se borran las canciones que contenga)
function deleteAlbum(req, res){
	var albumId = req.params.id; 

	Album.findByIdAndRemove(albumId, (err, albumRemoved)=>{
		if(err){
			res.status(500).send({message: 'Error al eliminar el album'});
		}else{
			if(!albumRemoved){
				res.status(404).send({message: 'El album no ha sido eliminado'});
			}else{

				Song.find({album: albumRemoved._id}).remove((err, songRemoved)=>{
					if(err){
						res.status(500).send({message: 'Error al eliminar la canción'});
					}else{
						if(!songRemoved){
							res.status(404).send({message: 'La canción no ha sido eliminada'});
						}else{
							res.status(200).send({album: albumRemoved});
						}
					}
				});
			}
		}
	});
}

// Función para subir una imagen: Se debe enviar en el contenido del cuerpo de la peticion un archivo denominado files y de tipo file
function uploadImage(req, res){
	var albumId = req.params.id;
	var file_name = 'No subido...';

	if(req.files){
		var file_path = req.files.image.path;
		var file_split = file_path.split('\\');
		var file_name = file_split[2];

		var ext_split = file_name.split('\.');
		var file_ext = ext_split[1];

		if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'gif'){

			Album.findByIdAndUpdate(albumId, {image: file_name}, (err, albumUpdated) => {
				if(!albumUpdated){
					res.status(404).send({message: 'No se ha podido actualizar el usuario'});
				}else{
					res.status(200).send({album: albumUpdated});
				}
			});

		}else{
			res.status(200).send({message: 'Extensión del archivo no valida'});
		}
		
	}else{
		res.status(200).send({message: 'No has subido ninguna imagen...'});
	}
}

// Función creada para mostrar una imagen: Se debe pasar por parametro el ID del album(De esta forma se protegen los recursos)
function getImageFile(req, res){
	var imageFile = req.params.imageFile;
	var path_file = './uploads/albums/'+imageFile;
	fs.exists(path_file, function(exists){
		if(exists){
			res.sendFile(path.resolve(path_file));
		}else{
			res.status(200).send({message: 'No existe la imagen...'});
		}
	});
}

// Exportamos las funciones para poder ser utilizadas desde las rutas
module.exports = {
	getAlbum,
	saveAlbum,
	getAlbums,
	updateAlbum,
	deleteAlbum,
	uploadImage,
	getImageFile
};