import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useEntregas } from '@/hooks/useEntregas';
import { useClientes } from '@/hooks/useClientes';
import { useEntregadores } from '@/hooks/useEntregadores';

// --- Zod Schema ---
const entregaSchema = z.object({
  data_pedido: z.string().nonempty('Data do pedido é obrigatória'),
  previsao_entrega: z.string().nonempty('Previsão de entrega é obrigatória'),
  descricao_compra: z.string().min(3, 'Descrição é obrigatória'),
  valor: z.number().min(0.01, 'Valor deve ser maior que zero'),
  cliente_id: z.string().min(1, 'Selecione um cliente'),
  entregador_id: z.string().min(1, 'Selecione um entregador'),
  situacao_pedido: z.enum(['pedido_confirmado', 'pronto_envio', 'enviado', 'entrega_realizada', 'entrega_sem_sucesso', 'devolvido_remetente', 'avariado', 'extravio']),
  origem: z.string().nonempty('O endereço de origem é obrigatório'),
  destino: z.string().nonempty('O endereço de destino é obrigatório'),
  codigo_rastreio: z.string().nullable().optional(),
  user_id: z.string().nullable().optional(), // Será preenchido no backend ou hook
});

type EntregaFormValues = z.infer<typeof entregaSchema>;

const FormEntrega = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { createEntrega, updateEntrega, entregas } = useEntregas();
  const { clientes } = useClientes();
  const { entregadores } = useEntregadores();

  const form = useForm<EntregaFormValues>({
    resolver: zodResolver(entregaSchema),
    defaultValues: {
      data_pedido: new Date().toISOString().split('T')[0],
      situacao_pedido: 'pedido_confirmado',
      previsao_entrega: '',
      descricao_compra: '',
      valor: 0,
      cliente_id: '',
      entregador_id: '',
      origem: '',
      destino: '',
      codigo_rastreio: ''
    }
  });

  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = form;

  useEffect(() => {
    if (isEditMode && entregas.length > 0) {
      const entregaId = Number(id);
      const entrega = entregas.find(e => e.id === entregaId);

      if (entrega) {
        // Formata datas e converte IDs para string para o formulário
        const formattedEntrega = {
          ...entrega,
          data_pedido: entrega.data_pedido ? new Date(entrega.data_pedido).toISOString().split('T')[0] : '',
          previsao_entrega: entrega.previsao_entrega ? new Date(entrega.previsao_entrega).toISOString().split('T')[0] : '',
          cliente_id: String(entrega.cliente_id),
          entregador_id: String(entrega.entregador_id),
        };
        reset(formattedEntrega);
      }
    }
  }, [id, isEditMode, entregas, reset]);

  const onSubmit: SubmitHandler<EntregaFormValues> = async (values) => {
    try {
      const dataForDb = {
        ...values,
        cliente_id: Number(values.cliente_id),
        entregador_id: Number(values.entregador_id),
      };

      if (isEditMode) {
        await updateEntrega(id!, dataForDb as any);
      } else {
        await createEntrega(dataForDb as any);
      }
      navigate('/entregas');
    } catch (e) {
      console.error('🔥 Falha ao enviar o formulário:', e);
    }
  };

  const entregadoresDisponiveis = entregadores.filter(e => e.cnh_situacao === 'no_prazo');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/entregas')} className="flex items-center gap-2 text-slate-600 hover:text-purple-600 transition"><ArrowLeft size={20} /> Voltar</button>
        <h1 className="text-3xl font-bold text-slate-800">{isEditMode ? 'Editar Entrega' : 'Nova Entrega'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Seção Única: Dados da Entrega */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Dados da Entrega</h2>
          <div className="grid md:grid-cols-3 gap-6">

            {/* Row 1 */}
            <div>
              <label className="font-medium text-slate-700">Data do Pedido*</label>
              <input type="date" {...register('data_pedido')} className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500"/>
              {errors.data_pedido && <p className="text-red-500 text-xs mt-1">{errors.data_pedido.message}</p>}
            </div>
            <div>
              <label className="font-medium text-slate-700">Previsão de Entrega*</label>
              <input type="date" {...register('previsao_entrega')} className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500"/>
              {errors.previsao_entrega && <p className="text-red-500 text-xs mt-1">{errors.previsao_entrega.message}</p>}
            </div>
            <div>
              <label className="font-medium text-slate-700">Valor do Pedido*</label>
              <input type="number" step="0.01" {...register('valor', { valueAsNumber: true })} className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500"/>
              {errors.valor && <p className="text-red-500 text-xs mt-1">{errors.valor.message}</p>}
            </div>

            {/* Row 2 */}
            <div>
              <label className="font-medium text-slate-700">Origem*</label>
              <input type="text" {...register('origem')} className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500"/>
              {errors.origem && <p className="text-red-500 text-xs mt-1">{errors.origem.message}</p>}
            </div>
            <div>
              <label className="font-medium text-slate-700">Destino*</label>
              <input type="text" {...register('destino')} className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500"/>
              {errors.destino && <p className="text-red-500 text-xs mt-1">{errors.destino.message}</p>}
            </div>
            <div>
              <label className="font-medium text-slate-700">Código de Rastreio</label>
              <input type="text" {...register('codigo_rastreio')} className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500"/>
              {errors.codigo_rastreio && <p className="text-red-500 text-xs mt-1">{errors.codigo_rastreio.message}</p>}
            </div>

            {/* Row 3 */}
            <div>
              <label className="font-medium text-slate-700">Cliente*</label>
              <Controller
                name="cliente_id"
                control={control}
                render={({ field }) => (
                  <select {...field} className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500">
                    <option value="">Selecione um cliente</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                )}
              />
              {errors.cliente_id && <p className="text-red-500 text-xs mt-1">{errors.cliente_id.message}</p>}
            </div>
            <div>
              <label className="font-medium text-slate-700">Entregador Responsável*</label>
              <Controller name="entregador_id" control={control} render={({ field }) => (
                  <select {...field} className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500">
                      <option value="">Selecione um entregador</option>
                      {entregadoresDisponiveis.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                  </select>
              )}/>
              {errors.entregador_id && <p className="text-red-500 text-xs mt-1">{errors.entregador_id.message}</p>}
            </div>
            <div>
              <label className="font-medium text-slate-700">Situação do Pedido*</label>
              <Controller name="situacao_pedido" control={control} render={({ field }) => (
                  <select {...field} className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500">
                      <option value="pedido_confirmado">Confirmado</option>
                      <option value="pronto_envio">Pronto</option>
                      <option value="enviado">Enviado</option>
                      <option value="entrega_realizada">Entregue</option>
                      <option value="entrega_sem_sucesso">Problemas</option>
                  </select>
              )}/>
              {errors.situacao_pedido && <p className="text-red-500 text-xs mt-1">{errors.situacao_pedido.message}</p>}
            </div>

            {/* Row 4 */}
            <div className="md:col-span-3">
              <label className="font-medium text-slate-700">Descrição*</label>
              <textarea {...register('descricao_compra')} className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500"/>
              {errors.descricao_compra && <p className="text-red-500 text-xs mt-1">{errors.descricao_compra.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl px-8 py-3 shadow-lg">
            {isSubmitting ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Salvar Entrega')}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default FormEntrega;