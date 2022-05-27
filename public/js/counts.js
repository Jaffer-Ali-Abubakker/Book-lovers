

function addToCart(proId){
    $.ajax({
          url:'/add-to-cart/'+proId,
              method:'get',
          success:(response)=>{
              if(response.status){
                      let count=$('#cart-counts').html()
                      count=parseInt(count)+1
                      $("#cart-counts").html(count)
                      Swal("Product Added To Cart",{icon:"success"})
                  }  else{
                    location.href='/login'
                  }
      }

})
}
function addToCart(proId){
          $.ajax({
              url:"/add-to-cart?id="+proId,
              method:"get",
              success:(response)=>{
                        if(response.status){
                            let count=$('#cart-counts').html()
                            count=parseInt(count)+1
                            $("#cart-counts").html(count)
                            Swal.fire("Product Added To Cart",{icon:"success"})      
                        }else{
                            location.href='/login'
                          }
                       
              }
    })

}

function addToWish(proId){
  $.ajax({
      url:'/added-to-wishList?id='+proId,
      method:'get',
      success:(response)=>{
          if(response.status){
              Swal.fire({
                  title: 'Item added to WishLIst',
                  icon: 'success',
                  iconColor:'#32a852',
                  showCancelButton: false,
                  confirmButtonColor: '#11ba25',
                  confirmButtonText: `Ok`
                }).then((result)=>{
                 
                  if(result.isConfirmed){

                      location.reload()
                  }
                })
          }
      }
  })
  
}
function removeWishProduct(wishId,proId){
  Swal.fire({
      title: 'Are you sure?',
      text: "You won't to remove the Product",
      icon: 'warning',
      iconColor:'#bf0f0f',
      showCancelButton: true,
      confirmButtonColor: '#11ba25',
      cancelButtonColor: '#bf0f0f',
      confirmButtonText: `Yes`
    }).then((result)=>{
        if(result.isConfirmed){
            
            $.ajax({
                url:'/remove-wishProduct',
                data:{
                    wish:wishId,
                    product:proId
                },
                method:'post',
                success:(response)=>{
                  location.reload()
                    if(response.removeProduct){
                        location.reload()
                    }
                }
            })
        }
    })
}
function deleteCartItem(cartId,proId){
  Swal.fire({
      title: 'Are you sure?',
      text: "You won't to remove the Product",
      icon: 'warning',
      iconColor:'#bf0f0f',
      showCancelButton: true,
      confirmButtonColor: '#11ba25',
      cancelButtonColor: '#bf0f0f',
      confirmButtonText: `Yes`
    }).then((result)=>{
        if(result.isConfirmed){

          $.ajax({
              url:'/delete-cart-item',
              data:{
                  cart:cartId,
                  product:proId
              },
              method:'post',
              success:(response)=>{
                  if(response.removeProduct){
                      
                      location.reload()
                  }
              }
          })
        }
    })

   
}

function deleteProduct(event){
    var link=event.currentTarget.href;
    var name=event.currentTarget.name;
    event.preventDefault();
    
       
    
Swal.fire({
  title: 'Are you sure?',
  text: "You won't to Delete!"+" "+name,
  icon: 'warning',
  iconColor:'#bf0f0f',
  showCancelButton: true,
  confirmButtonColor: '#11ba25',
  cancelButtonColor: '#bf0f0f',
  confirmButtonText: `Yes`
}).then((result) => {
  if (result.isConfirmed) {
      window.location=link;
  }else{
    return false;
  }
})
  }