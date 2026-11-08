using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace BgsFinds {
  internal sealed class PreviewServer : IDisposable {
    private readonly Dictionary<string,byte[]> files = new Dictionary<string,byte[]>(StringComparer.Ordinal);
    private readonly TcpListener listener;
    private volatile bool running = true;
    public int Port { get; private set; }
    public string Address { get { return "http://127.0.0.1:"+Port; } }
    public int FileCount { get { return files.Count; } }
    public PreviewServer() {
      using (Stream resource=Assembly.GetExecutingAssembly().GetManifestResourceStream("BgsSite")) {
        if(resource==null)throw new InvalidDataException("The embedded website is missing. Rebuild the program.");
        using(BinaryReader input=new BinaryReader(resource,Encoding.UTF8)) {
          if(Encoding.ASCII.GetString(input.ReadBytes(8))!="BGSFIND1")throw new InvalidDataException("Invalid website bundle.");
          int count=input.ReadInt32();if(count<1||count>2000)throw new InvalidDataException("Invalid file count.");
          long total=0;
          for(int i=0;i<count;i++) {
            int length=input.ReadInt32();if(length<1||length>2000)throw new InvalidDataException("Invalid path length.");
            string name=Encoding.UTF8.GetString(input.ReadBytes(length));
            int size=input.ReadInt32();total+=size;
            if(!name.StartsWith("/")||name.Contains("..")||size<0||size>20000000||total>80000000)throw new InvalidDataException("Invalid resource.");
            byte[] bytes=input.ReadBytes(size);if(bytes.Length!=size)throw new InvalidDataException("Truncated resource.");
            files.Add(name,bytes);
          }
        }
      }
      listener=new TcpListener(IPAddress.Loopback,0);listener.Start(16);
      Port=((IPEndPoint)listener.LocalEndpoint).Port;
      Thread accept=new Thread(AcceptLoop);accept.IsBackground=true;accept.Start();
    }
    private void AcceptLoop() {
      while(running)try{TcpClient client=listener.AcceptTcpClient();ThreadPool.QueueUserWorkItem(delegate(object state){Serve((TcpClient)state);},client);}catch(SocketException){if(!running)return;}catch(ObjectDisposedException){return;}
    }
    private void Serve(TcpClient client) {
      using(client)try {
        client.ReceiveTimeout=4000;client.SendTimeout=4000;
        using(NetworkStream stream=client.GetStream()) {
          StringBuilder headers=new StringBuilder();int last=0;
          for(int i=0;i<32768;i++){int b=stream.ReadByte();if(b<0)return;headers.Append((char)b);last=((last<<8)|b);if(last==0x0d0a0d0a)break;}
          string[] lines=headers.ToString().Split(new string[]{"\r\n"},StringSplitOptions.None);
          if(!headers.ToString().EndsWith("\r\n\r\n")||lines[0].Length>8192){Reply(stream,400,"Bad Request","text/plain",Encoding.UTF8.GetBytes("Invalid request"),false);return;}
          string[] request=lines[0].Split(' ');if(request.Length!=3){Reply(stream,400,"Bad Request","text/plain",new byte[0],false);return;}
          bool head=request[0]=="HEAD";
          if(request[0]!="GET"&&!head){Reply(stream,405,"Method Not Allowed","text/plain",Encoding.UTF8.GetBytes("Read-only preview"),false);return;}
          string host=null;for(int i=1;i<lines.Length;i++)if(lines[i].StartsWith("Host:",StringComparison.OrdinalIgnoreCase))host=lines[i].Substring(5).Trim();
          if(host!="127.0.0.1:"+Port&&host!="localhost:"+Port){Reply(stream,403,"Forbidden","text/plain",new byte[0],head);return;}
          string target=request[1].Split('?')[0];
          try{target=Uri.UnescapeDataString(target);}catch{target="";}
          if(!target.StartsWith("/")||target.Contains("..")||target.Contains("\\")||target.Contains("\0")){Reply(stream,404,"Not Found","text/plain",new byte[0],head);return;}
          if(target.EndsWith("/"))target+="index.html";
          byte[] body;
          if(!files.TryGetValue(target,out body)){Reply(stream,404,"Not Found","text/plain; charset=utf-8",Encoding.UTF8.GetBytes("Not found. Open /finds/ or /help/USER_GUIDE.html."),head);return;}
          string ext=Path.GetExtension(target).ToLowerInvariant(),type="application/octet-stream";
          if(ext==".html")type="text/html; charset=utf-8";else if(ext==".css")type="text/css; charset=utf-8";else if(ext==".js")type="text/javascript; charset=utf-8";else if(ext==".json")type="application/json; charset=utf-8";else if(ext==".png")type="image/png";else if(ext==".md"||ext==".txt")type="text/plain; charset=utf-8";
          Reply(stream,200,"OK",type,body,head);
        }
      }catch(IOException){}catch(SocketException){}catch(ObjectDisposedException){}
    }
    private static void Reply(NetworkStream stream,int code,string reason,string type,byte[] body,bool head) {
      byte[] header=Encoding.ASCII.GetBytes("HTTP/1.1 "+code+" "+reason+"\r\nContent-Type: "+type+"\r\nContent-Length: "+body.Length+"\r\nConnection: close\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nX-Robots-Tag: noindex, nofollow\r\n"+(code==405?"Allow: GET, HEAD\r\n":"")+"\r\n");
      stream.Write(header,0,header.Length);if(!head)stream.Write(body,0,body.Length);
    }
    public void Dispose(){running=false;listener.Stop();}
  }
  internal sealed class PreviewWindow : Form {
    private readonly PreviewServer server;
    private const string Live="https://brutal-game-studios-neon.brutalmotorworks.chatgpt.site/finds/";
    public PreviewWindow(PreviewServer value) {
      server=value;Text="BGS2026 Finds Preview";ClientSize=new Size(620,330);FormBorderStyle=FormBorderStyle.FixedDialog;MaximizeBox=false;StartPosition=FormStartPosition.CenterScreen;BackColor=Color.FromArgb(16,9,28);ForeColor=Color.White;Font=new Font("Segoe UI",10);
      Label heading=new Label{Text="BGS2026 FINDS",Left=28,Top=25,Width=560,Height=40,Font=new Font("Segoe UI",21,FontStyle.Bold),ForeColor=Color.FromArgb(223,239,131)};Controls.Add(heading);
      Label detail=new Label{Text="Local website preview and illustrated user guide.\nThis is a snapshot. It does not connect to Amazon's product API,\nmanage orders, or update the live website.",Left=30,Top=83,Width=560,Height=80};Controls.Add(detail);
      TextBox address=new TextBox{Text=server.Address+"/finds/",ReadOnly=true,Left=30,Top=175,Width=555};Controls.Add(address);
      AddButton("Open local preview",30,220,180,delegate{Open(server.Address+"/finds/");});
      AddButton("Read user guide",225,220,165,delegate{Open(server.Address+"/help/USER_GUIDE.html");});
      AddButton("Open live store",405,220,180,delegate{Open(Live);});
      AddButton("Stop preview and close",30,275,230,delegate{Close();});
      Label note=new Label{Text="No installation or administrator access needed.\nClosing this window stops the local server.",Left=280,Top=278,Width=310,Height=40,Font=new Font("Segoe UI",9)};Controls.Add(note);
      Shown+=delegate{Open(server.Address+"/finds/");};FormClosed+=delegate{server.Dispose();};
    }
    private void AddButton(string text,int left,int top,int width,Action action){Button button=new Button{Text=text,Left=left,Top=top,Width=width,Height=38,BackColor=Color.FromArgb(223,239,131),ForeColor=Color.FromArgb(16,9,28),FlatStyle=FlatStyle.Flat};button.Click+=delegate{action();};Controls.Add(button);}
    private void Open(string url){try{Process.Start(new ProcessStartInfo(url){UseShellExecute=true});}catch(Exception error){MessageBox.Show("Open this address in your browser:\n"+url+"\n\n"+error.Message,"Browser could not open");}}
  }
  internal static class Program {
    private static string Request(PreviewServer server,string target,string method,string host){using(TcpClient client=new TcpClient()){client.Connect(IPAddress.Loopback,server.Port);client.ReceiveTimeout=5000;using(NetworkStream stream=client.GetStream()){byte[] request=Encoding.ASCII.GetBytes(method+" "+target+" HTTP/1.1\r\nHost: "+host+"\r\nConnection: close\r\n\r\n");stream.Write(request,0,request.Length);using(MemoryStream result=new MemoryStream()){stream.CopyTo(result);return Encoding.UTF8.GetString(result.ToArray());}}}}
    private static int SelfTest(string report){try{using(PreviewServer server=new PreviewServer()){string host="127.0.0.1:"+server.Port;List<string> checks=new List<string>();
      Action<bool,string> require=delegate(bool ok,string name){if(!ok)throw new Exception(name);checks.Add(name);};
      string home=Request(server,"/finds/","GET",host);require(home.StartsWith("HTTP/1.1 200" )&&home.Contains("LOCAL PREVIEW")&&home.Contains("guide-search"),"embedded Finds page");
      string guide=Request(server,"/help/USER_GUIDE.html","GET",host);require(guide.StartsWith("HTTP/1.1 200")&&guide.Contains("BGS2026 Finds"),"embedded illustrated guide");
      string article=Request(server,"/finds/guides/retro-gaming-gifts/","GET",host);require(article.StartsWith("HTTP/1.1 200")&&article.Contains("Before you buy"),"embedded article");
      string head=Request(server,"/finds/","HEAD",host);require(head.StartsWith("HTTP/1.1 200")&&head.EndsWith("\r\n\r\n"),"HEAD has no body");
      require(Request(server,"/not-present","GET",host).StartsWith("HTTP/1.1 404"),"missing resource returns 404");
      require(Request(server,"/%2e%2e/private","GET",host).StartsWith("HTTP/1.1 404"),"encoded traversal rejected");
      require(Request(server,"/finds/","POST",host).StartsWith("HTTP/1.1 405"),"writes rejected");
      require(Request(server,"/finds/","GET","unexpected.example").StartsWith("HTTP/1.1 403"),"unexpected Host rejected");
      string catalog=Request(server,"/api/finds-catalog.json","GET",host);require(catalog.StartsWith("HTTP/1.1 200")&&catalog.Contains("\"items\":[]"),"empty authorized-photo catalog");
      string checksJson="[\""+String.Join("\",\"",checks.ToArray())+"\"]";
      File.WriteAllText(report,"{\"passed\":true,\"checkCount\":"+checks.Count+",\"resourceCount\":"+server.FileCount+",\"checks\":"+checksJson+"}",Encoding.UTF8);
    }return 0;}catch(Exception error){File.WriteAllText(report,"{\"passed\":false,\"error\":\""+error.Message.Replace("\\","\\\\").Replace("\"","\\\"").Replace("\n"," ").Replace("\r"," ")+"\"}",Encoding.UTF8);return 1;}}
    [STAThread]private static int Main(string[] args){if(args.Length==2&&args[0]=="--self-test")return SelfTest(Path.GetFullPath(args[1]));try{Application.EnableVisualStyles();Application.SetCompatibleTextRenderingDefault(false);using(PreviewServer server=new PreviewServer())Application.Run(new PreviewWindow(server));return 0;}catch(Exception error){MessageBox.Show(error.Message,"BGS2026 Finds Preview");return 1;}}
  }
}
