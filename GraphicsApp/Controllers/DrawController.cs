using GraphicsApp.Contexts;
using GraphicsApp.Services;
using GraphicsApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using GraphicsComLibrary;

namespace GraphicsApp.Controllers
{
    [Authorize]
    public class DrawController : Controller
    {
        private readonly BlobService _blobService;
        private readonly ApplicationDbContext _db;
        private readonly UserManager<IdentityUser> _userManager;
        private readonly GraphicsAlgorithms _graphics;
        public DrawController(BlobService blobService, ApplicationDbContext db, 
            UserManager<IdentityUser> userManager)
        {
            _blobService = blobService;
            _db = db;
            _userManager = userManager;
            _graphics = new GraphicsAlgorithms();
        }
        public IActionResult Index()
        {
            return View();
        }
        [HttpPost]
        public async Task<IActionResult> PostImage(string message)
        {
            var file = Request.Form.Files["image"];
            if(file==null) return BadRequest("No image");

            var user= await _userManager.GetUserAsync(User);

            using var stream = file.OpenReadStream();
            stream.Position = 0;
            var fileName = $"{Guid.NewGuid()}.png";
            Console.WriteLine($"FILE LENGTH: {file.Length}");
            try
            {
                var url = await _blobService.UploadAsync(stream, fileName);
                Console.WriteLine("BLOB URL: " + url);

                var post = new ImagePost
                {
                    BlobUrl = url,
                    Message = message,
                    UserId = user!.Id
                };
                _db.ImagePosts.Add(post);
                await _db.SaveChangesAsync();

                return RedirectToAction("Index", "Home");
            }
            catch (Exception ex)
            {
                Console.WriteLine("UPLOAD ERROR: " + ex.Message);
                throw;
            }
        }
        [HttpPost]
        public IActionResult DrawLine([FromBody] LineModel model)
        {
            int color = _graphics.HexToArgb(model.Color);

            var pixels = _graphics.DrawLine(
                model.X0, model.Y0,
                model.X1, model.Y1,
                color,
                model.Thickness
            );

            return Json(pixels);
        }
        [HttpPost]
        public IActionResult FloodFill([FromBody] FillModel model)
        {
            int replacementColor = _graphics.HexToArgb(model.Color);

            var result = _graphics.FloodFillSimple(
                model.Pixels,
                model.Width,
                model.Height,
                model.X,
                model.Y,
                replacementColor
            );

            return Json(result);
        }
    }
}
