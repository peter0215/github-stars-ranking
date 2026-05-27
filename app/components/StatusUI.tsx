export function LoadingUI() {
  return (
    <div className="text-center py-20 text-xl">
      正在加载 GitHub 仓库数据...
    </div>
  );
}

type ErrorUIProps = {
  msg: string;
};

export function ErrorUI({ msg }: ErrorUIProps) {
  return (
    <div className="text-center py-20 text-red-400 text-xl">
      ❌ {msg}
    </div>
  );
}