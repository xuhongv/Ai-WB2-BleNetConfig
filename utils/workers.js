// myworker.js
worker.onMessage(function(res){
  console.log('这是worker内部线程打印的')
  console.log(res)
  let sum = add(res.x,res.y);
  worker.postMessage({
    sum : sum
  })
});

function add(x,y){
  return x+y;
}
