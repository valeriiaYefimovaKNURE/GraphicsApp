using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Mvc;

namespace GraphicsApp.Services
{
    public class BlobService
    {
        private readonly BlobContainerClient _container;
        public BlobService(IConfiguration config)
        {
            var connectionString = config.GetConnectionString("StorageConnection");
            var client= new BlobServiceClient(connectionString);
            _container = client.GetBlobContainerClient("images");
        }
        public async Task<string> UploadAsync(Stream stream, string fileName)
        {
            await _container.CreateIfNotExistsAsync(PublicAccessType.Blob);

            var blob = _container.GetBlobClient(fileName);

            await blob.UploadAsync(stream, overwrite: true);

            var exists = await blob.ExistsAsync();

            if (!exists)
                throw new Exception("Blob was NOT uploaded!");

            return blob.Uri.ToString();
        }
    }
}
