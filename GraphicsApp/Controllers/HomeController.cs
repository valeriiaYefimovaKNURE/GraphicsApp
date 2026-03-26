using GraphicsApp.Contexts;
using GraphicsApp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

namespace GraphicsApp.Controllers
{
    public class HomeController : Controller
    {
        private readonly ApplicationDbContext _db;
        public HomeController(ApplicationDbContext db)
        {
            _db = db;
        }
        public async Task<IActionResult> Index()
        {
            var posts = from post in _db.ImagePosts
                        join user in _db.Users on post.UserId equals user.Id
                        orderby post.CreatedAt descending
                        select new ImagePostViewModel
                        {
                            Id = post.Id,
                            Message = post.Message,
                            BlobUrl = post.BlobUrl,
                            CreatedAt = post.CreatedAt,
                            UserName = user.UserName ?? "Невідоме ім'я"
                        };


            return View(await posts.ToListAsync());
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
