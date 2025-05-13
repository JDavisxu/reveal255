import { useEffect } from "react";
import {
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react";
import useNotificationStore from "../stores/useNotificationStore";
import { useConnection } from "@solana/wallet-adapter-react";
import { useNetworkConfiguration } from "contexts/NetworkConfigurationProvider";


const NotificationList = () => {
  const notifications = useNotificationStore((s) => s.notifications);
  const setNotificationStore = useNotificationStore((s) => s.set);

  const reversed = [...notifications].reverse();

  return (
    <div className="z-50 fixed bottom-5 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-3 pointer-events-none">

      {reversed.map((n, idx) => (
        <Notification
          key={`${n.message}${idx}`}
          type={n.type}
          message={n.message}
          description={n.description}
          txid={n.txid}
          onHide={() => {
            setNotificationStore((state) => ({
              notifications: state.notifications.filter(
                (_, i) => i !== notifications.length - 1 - idx
              ),
            }));
          }}
          
        />
      ))}
    </div>
  );
};

const Notification = ({ type, message, description, txid, onHide }) => {
  const { networkConfiguration } = useNetworkConfiguration();
  const txUrl = txid
    ? `https://explorer.solana.com/tx/${txid}?cluster=${networkConfiguration}`
    : null;

  useEffect(() => {
    const id = setTimeout(() => {
      onHide();
    }, 5000);

    return () => clearTimeout(id);
  }, [onHide]);

  return (
    <div className="w-[22rem] bg-zinc-900 text-white shadow-lg rounded-lg p-4 pointer-events-auto ring-1 ring-black ring-opacity-30">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {type === "success" && (
            <CheckCircleIcon className="h-6 w-6 text-green-400" />
          )}
          {type === "info" && (
            <InformationCircleIcon className="h-6 w-6 text-blue-400" />
          )}
          {type === "error" && <XCircleIcon className="h-6 w-6 text-red-400" />}
        </div>

        <div className="ml-3 flex-1">
          <p className="font-semibold">{message}</p>
          {description && (
            <p className="text-sm text-gray-300 mt-1">{description}</p>
          )}
          {txUrl && (
            <a
              href={txUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block text-sm text-blue-400 hover:underline"
            >
              🔗 View on Solana Explorer
            </a>
          )}
        </div>

        <div className="ml-4 flex-shrink-0">
          <button
            onClick={onHide}
            className="text-gray-400 hover:text-white transition"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationList;
