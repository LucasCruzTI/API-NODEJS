const express = require('express');
const server = express();

const NodeCache = require( "node-cache" );
const cache = new NodeCache();

const resultados = {
  pessoas: [{id:1, nome: "Marcelo"}, {id:2, nome: "João"}, {id:3, nome: "Maria"}],
  carros: [{id:1, modelo: "Fusca"}, {id:2, modelo: "Gol"}, {id:3, modelo: "Palio"}],
  animais: [{id:1, nome: "Cachorro"}, {id:2, nome: "Gato"}, {id:3, nome: "Papagaio"}]
}

const time = 2 * 60 // segundos

server.get('/', (req, res) => {
    const keys = Object.keys(resultados);
    const url = req.originalUrl;

    const cacheData = cache.get(url);

  if(cacheData) {
    return res.status(304).send(cacheData);
  }

  const urlsDisponiveis = keys.map( key => {
    return { 
      description: `Endpoint para retorno de ${key}`,
      list: `/${key}`,
      detail: `/${key}/:id`
    }
  })

  cache.set(url,urlsDisponiveis, time)

  res.status(200).send(urlsDisponiveis)

});

server.get('/:path', (req, res, next) => {

    const { params : { path } } = req;
    const data = resultados[path];
    try{
      const cacheData = cache.get(path);
  
      if(cacheData) {
        return res.status(304).send(cacheData);
      }
        
      let status = 200;
      let mensagem = 'Ok';
    
      if(!data) {
        status = 400
        mensagem = 'Requisição não pode ser encontrada'
      }
      
      const responseData = {
        data: data ?? {},
        mensagem
      }
        
      cache.set( path ,responseData, time);
      
      return res.status(status).send(responseData);
    }
    catch(error){
      console.log(error);
      next(error);
    }

    
});

server.get('/:path/:id', (req, res, next) => {
  const { params : { id, path } } = req
  const data = resultados[path]

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
      mensagem = "Requisição indisponível"
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

server.use((error, req, res, next) => {
  console.log('error middleware');

  const responseData = {
    mensagem: "Ocorreu algum problema na requisição"
  }

  return res.sendStatus(500).send(responseData);
})

server.listen(3000, () => {
    console.log('Server started on port 3000...')
});