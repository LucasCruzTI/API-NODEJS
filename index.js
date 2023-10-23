const express = require('express');
const server = express();

const NodeCache = require( "node-cache" );
// stdTTL é o maximo de tempo possível para um cache gerado
const cache = new NodeCache();

const obj = {
  pessoas: [{id:1, nome: "Miguel"}, {id:2, nome: "Gael"}, {id:3, nome: "Maria"}],
  carros: [{id:1, modelo: "Strada"}, {id:2, modelo: "Onix"}, {id:3, modelo: "Polo"}],
  animais: [{id:1, nome: "Cachorro"}, {id:2, nome: "Gato"}, {id:3, nome: "Cavalo"}]
}

const time = 2 * 60 // segundos

server.get('/', (req, res) => {
    const keys = Object.keys(obj);
    const url = req.originalUrl;

    const cacheData = cache.get(url);

  if(cacheData) {
    return res.status(304).send(cacheData);
  }

  const urlsDisponiveis = keys.map( key => {
    return { 
      description: `Endpont que retorna ${key}`,
      list: `/${key}`,
      detail: `/${key}/:id`
    }
  })

  cache.set(url,urlsDisponiveis, time)

  res.status(200).send(urlsDisponiveis)

});

server.get('/:path', (req, res) => {

    const { params : { path } } = req;
    const data = obj[path];
    
    const cacheData = cache.get(path);
  
    if(cacheData) {
      return res.status(304).send(cacheData);
    }
      
    let status = 200;
    let mensagem = 'Ok';
  
    if(!data) {
      status = 400
      mensagem = 'Requisição inválida'
    }
    
    const responseData = {
      data: data ?? {},
      mensagem
    }
      
    cache.set( path ,responseData, time);
    
    return res.status(status).send(responseData);
    
});

server.get('/:path/:id', (req, res, next) => {
  const { params : { id, path } } = req
  const data = obj[path]

  const keyCache = `${path}_${id}`
  
  try {
    const cacheData = cache.get( keyCache );

    if(cacheData) {
      return res.status(304).send(cacheData)
    }
    
    const result = data.find( item => item.id === Number(id)) 
    
    let status = 200
    let mensagem = 'Ok'

    if(!result) {
      status = 404
      mensagem = "Requisição não encontrada"
    }

    const responseData = {
      data: result ?? {},
      mensagem
    }

    cache.set( keyCache, responseData, time);
    
    return res.status(status).send(responseData);
  } 
  catch (error) {
    console.log(error);
    next(error);
  }
  
});


server.listen(3000, () => {
    console.log('Server started on port 3000...')
});