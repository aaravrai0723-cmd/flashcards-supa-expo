CREATE TRIGGER on_storage_object_created AFTER INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION create_job_on_file_upload();


