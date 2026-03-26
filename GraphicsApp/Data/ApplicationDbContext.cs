using GraphicsApp.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace GraphicsApp.Contexts
{
    public class ApplicationDbContext:IdentityDbContext
    {
        public DbSet<ImagePost> ImagePosts { get; set; }
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }
    }
}
