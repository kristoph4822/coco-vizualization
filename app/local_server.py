import http.server
import socketserver
import multiprocessing

PORT = 5001

# run tcp server from given directory
# source: https://stackoverflow.com/questions/39801718/how-to-run-a-http-server-which-serves-a-specific-path
def handler_from(directory):
    def __init__(self, *args, **kwargs):
        return http.server.SimpleHTTPRequestHandler.__init__(self, *args, directory=self.directory, **kwargs)
    
    return  type(f'HandlerFrom<{directory}>',
            (http.server.SimpleHTTPRequestHandler,),
            {'__init__': __init__, 'directory': directory})

def run_tcp_server(directory):
    httpd = socketserver.TCPServer(("", PORT), handler_from(directory))
    httpd.serve_forever()


class LocalServer:

    def __init__(self):
        self.port = PORT
        self.directory = None

    # setting directory runs tcp server in separete thread
    def set_directory(self, directory):
        self.directory = directory

        # if thread already exists (for other dir), it is terminated
        if hasattr(self, 'tcp_thread'):
            self.tcp_thread.terminate()

        self.tcp_thread = multiprocessing.Process(
            target=run_tcp_server, 
            args=(directory,)
            )
    
        self.tcp_thread.start()
